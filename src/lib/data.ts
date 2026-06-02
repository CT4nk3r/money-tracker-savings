import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { redirect } from "next/navigation";
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

export async function requireUserId() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

export async function getOrCreateSettings(clerkUserId: string) {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.clerkUserId, clerkUserId))
    .limit(1);

  if (settings) {
    return settings;
  }

  const [created] = await db
    .insert(userSettings)
    .values({ clerkUserId })
    .onConflictDoUpdate({
      target: userSettings.clerkUserId,
      set: { updatedAt: new Date() },
    })
    .returning();

  return created;
}

export async function getSavingsAccountsForUser(clerkUserId: string) {
  const rows = await getDb()
    .select({
      id: savingsAccounts.id,
      name: savingsAccounts.name,
      role: savingsAccountMembers.role,
      createdAt: savingsAccounts.createdAt,
    })
    .from(savingsAccountMembers)
    .innerJoin(
      savingsAccounts,
      eq(savingsAccountMembers.accountId, savingsAccounts.id),
    )
    .where(eq(savingsAccountMembers.clerkUserId, clerkUserId))
    .orderBy(savingsAccounts.createdAt);

  return rows;
}

export async function getPendingSavingsInvitesForEmails(emails: string[]) {
  const normalizedEmails = emails.map((email) => email.trim().toLowerCase()).filter(Boolean);

  if (!normalizedEmails.length) {
    return [];
  }

  return getDb()
    .select({
      id: savingsAccountInvites.id,
      invitedEmail: savingsAccountInvites.invitedEmail,
      accountName: savingsAccounts.name,
      createdAt: savingsAccountInvites.createdAt,
    })
    .from(savingsAccountInvites)
    .innerJoin(
      savingsAccounts,
      eq(savingsAccountInvites.accountId, savingsAccounts.id),
    )
    .where(
      and(
        inArray(savingsAccountInvites.invitedEmail, normalizedEmails),
        eq(savingsAccountInvites.status, "pending"),
      ),
    )
    .orderBy(desc(savingsAccountInvites.createdAt));
}

export async function assertSavingsAccountMember(
  clerkUserId: string,
  accountId: string,
) {
  const [membership] = await getDb()
    .select()
    .from(savingsAccountMembers)
    .where(
      and(
        eq(savingsAccountMembers.accountId, accountId),
        eq(savingsAccountMembers.clerkUserId, clerkUserId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("Joint account not found.");
  }

  return membership;
}

async function getAccessibleAccountIds(clerkUserId: string) {
  const accounts = await getSavingsAccountsForUser(clerkUserId);
  return accounts.map((account) => account.id);
}

function accessibleAccountFilter(
  clerkUserId: string,
  accountIds: string[],
  table: { clerkUserId: AnyPgColumn; accountId: AnyPgColumn },
) {
  const personalFilter = and(eq(table.clerkUserId, clerkUserId), isNull(table.accountId));

  if (!accountIds.length) {
    return personalFilter;
  }

  return or(personalFilter, inArray(table.accountId, accountIds));
}

export async function getGoalsView(clerkUserId: string) {
  const db = getDb();
  const accountIds = await getAccessibleAccountIds(clerkUserId);
  const [items, allocations] = await Promise.all([
    db
      .select()
      .from(goals)
      .where(accessibleAccountFilter(clerkUserId, accountIds, goals))
      .orderBy(goals.sortOrder, goals.createdAt),
    db
      .select()
      .from(goalAllocations)
      .where(accessibleAccountFilter(clerkUserId, accountIds, goalAllocations)),
  ]);

  return items.map((goal) => ({
    ...goal,
    savedAmountMinor: allocations
      .filter((allocation) => allocation.goalId === goal.id && allocation.status === "active")
      .reduce((sum, allocation) => sum + allocation.targetAmountMinor, 0),
  }));
}

export async function getWishlistView(clerkUserId: string) {
  const db = getDb();
  const [items, allocations] = await Promise.all([
    db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.clerkUserId, clerkUserId))
      .orderBy(wishlistItems.rank, wishlistItems.createdAt),
    db
      .select()
      .from(wishlistAllocations)
      .where(eq(wishlistAllocations.clerkUserId, clerkUserId)),
  ]);

  return items.map((item) => ({
    ...item,
    savedAmountMinor: allocations
      .filter(
        (allocation) =>
          allocation.wishlistItemId === item.id && allocation.status === "active",
      )
      .reduce((sum, allocation) => sum + allocation.targetAmountMinor, 0),
  }));
}

export async function getUnallocatedBalances(
  clerkUserId: string,
  accountId?: string | null,
) {
  const db = getDb();

  if (accountId) {
    await assertSavingsAccountMember(clerkUserId, accountId);
  }

  const accountIds = accountId === undefined ? await getAccessibleAccountIds(clerkUserId) : [];
  const filter = accountId
    ? eq(savingsTransactions.accountId, accountId)
    : accountId === null
      ? and(eq(savingsTransactions.clerkUserId, clerkUserId), isNull(savingsTransactions.accountId))
      : accessibleAccountFilter(clerkUserId, accountIds, savingsTransactions);
  const goalFilter = accountId
    ? eq(goalAllocations.accountId, accountId)
    : accountId === null
      ? and(eq(goalAllocations.clerkUserId, clerkUserId), isNull(goalAllocations.accountId))
      : accessibleAccountFilter(clerkUserId, accountIds, goalAllocations);
  const [transactions, goalFunds, wishlistFunds] = await Promise.all([
    db
      .select()
      .from(savingsTransactions)
      .where(filter),
    db
      .select()
      .from(goalAllocations)
      .where(goalFilter),
    accountId
      ? Promise.resolve([])
      : db
          .select()
          .from(wishlistAllocations)
          .where(
            and(
              eq(wishlistAllocations.clerkUserId, clerkUserId),
              inArray(wishlistAllocations.status, ["active", "spent"]),
            ),
          ),
  ]);

  const balances = new Map<string, number>();

  for (const transaction of transactions) {
    if (
      transaction.type !== "deposit" &&
      transaction.type !== "release" &&
      transaction.type !== "withdrawal"
    ) {
      continue;
    }

    balances.set(
      transaction.currency,
      (balances.get(transaction.currency) ?? 0) +
        (transaction.type === "withdrawal" ? -transaction.amountMinor : transaction.amountMinor),
    );
  }

  for (const allocation of [...goalFunds, ...wishlistFunds]) {
    if (allocation.status !== "active" && allocation.status !== "spent") {
      continue;
    }

    balances.set(
      allocation.sourceCurrency,
      (balances.get(allocation.sourceCurrency) ?? 0) - allocation.sourceAmountMinor,
    );
  }

  return Array.from(balances.entries())
    .map(([currency, amountMinor]) => ({ currency, amountMinor }))
    .filter((balance) => balance.amountMinor !== 0)
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export async function getUnallocatedBalanceGroups(clerkUserId: string) {
  const accounts = await getSavingsAccountsForUser(clerkUserId);
  const [personal, ...jointBalances] = await Promise.all([
    getUnallocatedBalances(clerkUserId, null),
    ...accounts.map((account) => getUnallocatedBalances(clerkUserId, account.id)),
  ]);

  return [
    {
      id: "personal",
      name: "Personal savings",
      type: "personal" as const,
      balances: personal,
    },
    ...accounts.map((account, index) => ({
      id: account.id,
      name: account.name,
      type: "joint" as const,
      balances: jointBalances[index] ?? [],
    })),
  ];
}

export async function getRecentTransactions(clerkUserId: string) {
  const accountIds = await getAccessibleAccountIds(clerkUserId);

  return getDb()
    .select()
    .from(savingsTransactions)
    .where(accessibleAccountFilter(clerkUserId, accountIds, savingsTransactions))
    .orderBy(desc(savingsTransactions.createdAt))
    .limit(8);
}

export async function getDashboardData(clerkUserId: string) {
  const [settings, accounts, balanceGroups, goalRows, wishlistRows, transactions] = await Promise.all([
    getOrCreateSettings(clerkUserId),
    getSavingsAccountsForUser(clerkUserId),
    getUnallocatedBalanceGroups(clerkUserId),
    getGoalsView(clerkUserId),
    getWishlistView(clerkUserId),
    getRecentTransactions(clerkUserId),
  ]);

  return {
    settings,
    accounts,
    balanceGroups,
    goals: goalRows.filter((goal) => goal.status === "active").slice(0, 4),
    wishlist: wishlistRows
      .filter((item) => item.status === "active" || item.status === "ready")
      .slice(0, 5),
    transactions,
  };
}

export async function getActiveWishlistFundingCandidates(clerkUserId: string) {
  const wishlist = await getWishlistView(clerkUserId);

  return wishlist
    .filter((item) => item.status === "active" || item.status === "ready")
    .map((item) => ({
      id: item.id,
      rank: item.rank,
      currency: item.currency,
      neededTargetMinor: Math.max(0, item.currentPriceMinor - item.savedAmountMinor),
    }))
    .filter((item) => item.neededTargetMinor > 0);
}

export async function assertGoalOwner(clerkUserId: string, goalId: string) {
  const [goal] = await getDb()
    .select()
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);

  if (!goal || (!goal.accountId && goal.clerkUserId !== clerkUserId)) {
    throw new Error("Goal not found.");
  }

  if (goal.accountId) {
    await assertSavingsAccountMember(clerkUserId, goal.accountId);
  }

  return goal;
}

export async function assertWishlistOwner(clerkUserId: string, wishlistItemId: string) {
  const [item] = await getDb()
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.id, wishlistItemId),
        eq(wishlistItems.clerkUserId, clerkUserId),
      ),
    )
    .limit(1);

  if (!item) {
    throw new Error("Wishlist item not found.");
  }

  return item;
}

export async function getWishlistAllocationsForItem(
  clerkUserId: string,
  wishlistItemId: string,
) {
  return getDb()
    .select()
    .from(wishlistAllocations)
    .where(
      and(
        eq(wishlistAllocations.clerkUserId, clerkUserId),
        eq(wishlistAllocations.wishlistItemId, wishlistItemId),
        eq(wishlistAllocations.status, "active"),
      ),
    )
    .orderBy(desc(wishlistAllocations.createdAt));
}
