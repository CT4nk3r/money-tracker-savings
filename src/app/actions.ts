"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/db";
import {
  goalAllocations,
  goals,
  savingsAccountInvites,
  savingsAccountMembers,
  savingsAccounts,
  savingsTransactions,
  userSettings,
  wishlistAllocations,
  wishlistItems,
} from "@/db/schema";
import { isCurrencyCode } from "@/lib/currencies";
import {
  assertGoalOwner,
  assertSavingsAccountMember,
  assertWishlistOwner,
  getActiveWishlistFundingCandidates,
  getOrCreateSettings,
  getUnallocatedBalances,
  getWishlistAllocationsForItem,
  requireUserId,
} from "@/lib/data";
import { convertWithRateSnapshot } from "@/lib/fx";
import { parseAmountToMinor } from "@/lib/money";
import { planWishlistFunding } from "@/lib/wishlist-planner";

const currencySchema = z.string().refine(isCurrencyCode, "Unsupported currency.");
const fundingModeSchema = z.enum(["manual", "top_first", "weighted_split"]);
const emailSchema = z.email().transform((email) => email.toLowerCase());

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function revalidateApp() {
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  revalidatePath("/wishlist");
  revalidatePath("/settings");
}

function optionalAccountId(formData: FormData) {
  return stringValue(formData, "accountId") || null;
}

async function createWishlistAllocation(
  clerkUserId: string,
  wishlistItemId: string,
  sourceAmountMinor: number,
  sourceCurrency: string,
) {
  const db = getDb();
  const item = await assertWishlistOwner(clerkUserId, wishlistItemId);
  await assertEnoughUnallocated(clerkUserId, sourceCurrency, sourceAmountMinor);
  const converted = await convertWithRateSnapshot(
    sourceAmountMinor,
    sourceCurrency,
    item.currency,
  );

  await db.insert(wishlistAllocations).values({
    clerkUserId,
    wishlistItemId,
    sourceAmountMinor,
    sourceCurrency,
    targetAmountMinor: converted.amountMinor,
    targetCurrency: item.currency,
    exchangeRateId: converted.exchangeRateId,
  });

  await db.insert(savingsTransactions).values({
    clerkUserId,
    type: "wishlist_allocation",
    amountMinor: sourceAmountMinor,
    currency: sourceCurrency,
    wishlistItemId,
    note: `Allocated to ${item.title}`,
  });

  const allocations = await getWishlistAllocationsForItem(clerkUserId, wishlistItemId);
  const savedAmountMinor = allocations.reduce(
    (sum, allocation) => sum + allocation.targetAmountMinor,
    0,
  );

  if (savedAmountMinor >= item.currentPriceMinor && item.status === "active") {
    await db
      .update(wishlistItems)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eqWishlistItem(clerkUserId, wishlistItemId));
  }
}

async function assertEnoughUnallocated(
  clerkUserId: string,
  currency: string,
  requestedAmountMinor: number,
  accountId: string | null = null,
) {
  const balances = await getUnallocatedBalances(clerkUserId, accountId);
  const available = balances.find((balance) => balance.currency === currency)?.amountMinor ?? 0;

  if (available < requestedAmountMinor) {
    throw new Error("There is not enough unallocated savings in that currency.");
  }
}

function eqWishlistItem(clerkUserId: string, wishlistItemId: string) {
  return and(eq(wishlistItems.clerkUserId, clerkUserId), eq(wishlistItems.id, wishlistItemId));
}

export async function createDeposit(formData: FormData) {
  const clerkUserId = await requireUserId();
  const currency = currencySchema.parse(stringValue(formData, "currency"));
  const amountMinor = parseAmountToMinor(stringValue(formData, "amount"), currency);
  const rawMode = stringValue(formData, "fundingMode");
  const accountId = optionalAccountId(formData);
  const settings = await getOrCreateSettings(clerkUserId);
  const fundingMode = fundingModeSchema.parse(rawMode || settings.defaultFundingMode);
  const db = getDb();

  if (accountId) {
    await assertSavingsAccountMember(clerkUserId, accountId);
  }

  await db.insert(savingsTransactions).values({
    clerkUserId,
    accountId,
    type: "deposit",
    amountMinor,
    currency,
    note: stringValue(formData, "note") || null,
  });

  if (fundingMode !== "manual" && !accountId) {
    const candidates = await getActiveWishlistFundingCandidates(clerkUserId);
    const candidatesInSource = [];

    for (const candidate of candidates) {
      const converted = await convertWithRateSnapshot(
        candidate.neededTargetMinor,
        candidate.currency,
        currency,
      );
      candidatesInSource.push({
        id: candidate.id,
        rank: candidate.rank,
        neededSourceMinor: converted.amountMinor,
      });
    }

    const plan = planWishlistFunding(amountMinor, fundingMode, candidatesInSource);

    for (const item of plan) {
      await createWishlistAllocation(
        clerkUserId,
        item.itemId,
        item.sourceAmountMinor,
        currency,
      );
    }
  }

  revalidateApp();
}

export async function createGoal(formData: FormData) {
  const clerkUserId = await requireUserId();
  const currency = currencySchema.parse(stringValue(formData, "currency"));
  const accountId = optionalAccountId(formData);

  if (accountId) {
    await assertSavingsAccountMember(clerkUserId, accountId);
  }

  await getDb().insert(goals).values({
    clerkUserId,
    accountId,
    name: stringValue(formData, "name"),
    targetAmountMinor: parseAmountToMinor(stringValue(formData, "targetAmount"), currency),
    currency,
    notes: stringValue(formData, "notes") || null,
  });

  revalidateApp();
}

export async function allocateToGoal(formData: FormData) {
  const clerkUserId = await requireUserId();
  const goalId = stringValue(formData, "goalId");
  const currency = currencySchema.parse(stringValue(formData, "currency"));
  const sourceAmountMinor = parseAmountToMinor(stringValue(formData, "amount"), currency);
  const goal = await assertGoalOwner(clerkUserId, goalId);
  await assertEnoughUnallocated(clerkUserId, currency, sourceAmountMinor, goal.accountId);
  const converted = await convertWithRateSnapshot(sourceAmountMinor, currency, goal.currency);

  await getDb().insert(goalAllocations).values({
    clerkUserId,
    accountId: goal.accountId,
    goalId,
    sourceAmountMinor,
    sourceCurrency: currency,
    targetAmountMinor: converted.amountMinor,
    targetCurrency: goal.currency,
    exchangeRateId: converted.exchangeRateId,
  });

  await getDb().insert(savingsTransactions).values({
    clerkUserId,
    accountId: goal.accountId,
    type: "goal_allocation",
    amountMinor: sourceAmountMinor,
    currency,
    goalId,
    note: `Allocated to ${goal.name}`,
  });

  revalidateApp();
}

export async function createWishlistItem(formData: FormData) {
  const clerkUserId = await requireUserId();
  const currency = currencySchema.parse(stringValue(formData, "currency"));
  const currentPriceMinor = parseAmountToMinor(stringValue(formData, "currentPrice"), currency);
  const originalPriceInput = stringValue(formData, "originalPrice");

  await getDb().insert(wishlistItems).values({
    clerkUserId,
    title: stringValue(formData, "title"),
    originalPriceMinor: originalPriceInput
      ? parseAmountToMinor(originalPriceInput, currency)
      : currentPriceMinor,
    currentPriceMinor,
    currency,
    rank: Number(stringValue(formData, "rank") || 1),
    url: stringValue(formData, "url") || null,
    notes: stringValue(formData, "notes") || null,
  });

  revalidateApp();
}

export async function allocateToWishlist(formData: FormData) {
  const clerkUserId = await requireUserId();
  const currency = currencySchema.parse(stringValue(formData, "currency"));
  const sourceAmountMinor = parseAmountToMinor(stringValue(formData, "amount"), currency);

  await createWishlistAllocation(
    clerkUserId,
    stringValue(formData, "wishlistItemId"),
    sourceAmountMinor,
    currency,
  );

  revalidateApp();
}

export async function updateWishlistPrice(formData: FormData) {
  const clerkUserId = await requireUserId();
  const wishlistItemId = stringValue(formData, "wishlistItemId");
  const item = await assertWishlistOwner(clerkUserId, wishlistItemId);
  const currentPriceMinor = parseAmountToMinor(
    stringValue(formData, "currentPrice"),
    item.currency,
  );
  const db = getDb();

  await db
    .update(wishlistItems)
    .set({ currentPriceMinor, updatedAt: new Date() })
    .where(eqWishlistItem(clerkUserId, wishlistItemId));

  const allocations = await getWishlistAllocationsForItem(clerkUserId, wishlistItemId);
  let savedAmountMinor = allocations.reduce(
    (sum, allocation) => sum + allocation.targetAmountMinor,
    0,
  );
  let excessTargetMinor = Math.max(0, savedAmountMinor - currentPriceMinor);

  for (const allocation of allocations) {
    if (excessTargetMinor <= 0) {
      break;
    }

    const targetReleaseMinor = Math.min(excessTargetMinor, allocation.targetAmountMinor);
    const sourceReleaseMinor = Math.round(
      (allocation.sourceAmountMinor * targetReleaseMinor) / allocation.targetAmountMinor,
    );
    const fullyReleased = targetReleaseMinor === allocation.targetAmountMinor;

    await db
      .update(wishlistAllocations)
      .set({
        sourceAmountMinor: allocation.sourceAmountMinor - sourceReleaseMinor,
        targetAmountMinor: allocation.targetAmountMinor - targetReleaseMinor,
        status: fullyReleased ? "released" : "active",
        updatedAt: new Date(),
      })
      .where(eqWishlistAllocation(clerkUserId, allocation.id));

    await db.insert(savingsTransactions).values({
      clerkUserId,
      type: "release",
      amountMinor: sourceReleaseMinor,
      currency: allocation.sourceCurrency,
      wishlistItemId,
      note: `Released discount excess from ${item.title}`,
    });

    savedAmountMinor -= targetReleaseMinor;
    excessTargetMinor -= targetReleaseMinor;
  }

  await db
    .update(wishlistItems)
    .set({
      status: savedAmountMinor >= currentPriceMinor ? "ready" : "active",
      updatedAt: new Date(),
    })
    .where(eqWishlistItem(clerkUserId, wishlistItemId));

  revalidateApp();
}

function eqWishlistAllocation(clerkUserId: string, allocationId: string) {
  return and(
    eq(wishlistAllocations.clerkUserId, clerkUserId),
    eq(wishlistAllocations.id, allocationId),
  );
}

export async function purchaseWishlistItem(formData: FormData) {
  const clerkUserId = await requireUserId();
  const wishlistItemId = stringValue(formData, "wishlistItemId");
  const item = await assertWishlistOwner(clerkUserId, wishlistItemId);
  const db = getDb();

  await db
    .update(wishlistAllocations)
    .set({ status: "spent", updatedAt: new Date() })
    .where(eqWishlistItemAllocations(clerkUserId, wishlistItemId));

  await db
    .update(wishlistItems)
    .set({ status: "purchased", purchasedAt: new Date(), updatedAt: new Date() })
    .where(eqWishlistItem(clerkUserId, wishlistItemId));

  await db.insert(savingsTransactions).values({
    clerkUserId,
    type: "purchase",
    amountMinor: item.currentPriceMinor,
    currency: item.currency,
    wishlistItemId,
    note: `Purchased ${item.title}`,
  });

  revalidateApp();
}

function eqWishlistItemAllocations(clerkUserId: string, wishlistItemId: string) {
  return and(
    eq(wishlistAllocations.clerkUserId, clerkUserId),
    eq(wishlistAllocations.wishlistItemId, wishlistItemId),
  );
}

export async function updateSettings(formData: FormData) {
  const clerkUserId = await requireUserId();
  const displayCurrency = currencySchema.parse(stringValue(formData, "displayCurrency"));
  const defaultFundingMode = fundingModeSchema.parse(
    stringValue(formData, "defaultFundingMode"),
  );

  await getDb()
    .insert(userSettings)
    .values({ clerkUserId, displayCurrency, defaultFundingMode })
    .onConflictDoUpdate({
      target: userSettings.clerkUserId,
      set: { displayCurrency, defaultFundingMode, updatedAt: new Date() },
    });

  revalidateApp();
}

export async function createSavingsAccount(formData: FormData) {
  const clerkUserId = await requireUserId();
  const user = await currentUser();
  const name = stringValue(formData, "name");
  const invitedEmail = emailSchema.parse(stringValue(formData, "invitedEmail"));

  if (!name) {
    throw new Error("Account name is required.");
  }

  const db = getDb();
  const [account] = await db
    .insert(savingsAccounts)
    .values({ name, createdByClerkUserId: clerkUserId })
    .returning();

  const primaryEmail =
    user?.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  await db.insert(savingsAccountMembers).values({
    accountId: account.id,
    clerkUserId,
    email: primaryEmail?.toLowerCase() ?? null,
    role: "owner",
  });

  await db.insert(savingsAccountInvites).values({
    accountId: account.id,
    invitedEmail,
    invitedByClerkUserId: clerkUserId,
  });

  revalidateApp();
}

export async function acceptSavingsAccountInvite(formData: FormData) {
  const clerkUserId = await requireUserId();
  const user = await currentUser();
  const inviteId = stringValue(formData, "inviteId");
  const emails =
    user?.emailAddresses.map((email) => email.emailAddress.toLowerCase()) ?? [];

  const db = getDb();
  const [invite] = await db
    .select()
    .from(savingsAccountInvites)
    .where(and(eq(savingsAccountInvites.id, inviteId), eq(savingsAccountInvites.status, "pending")))
    .limit(1);

  if (!invite || !emails.includes(invite.invitedEmail)) {
    throw new Error("Invite not found for this account.");
  }

  await db.insert(savingsAccountMembers).values({
    accountId: invite.accountId,
    clerkUserId,
    email: invite.invitedEmail,
    role: "member",
  });

  await db
    .update(savingsAccountInvites)
    .set({
      status: "accepted",
      acceptedByClerkUserId: clerkUserId,
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(savingsAccountInvites.id, invite.id));

  revalidateApp();
}
