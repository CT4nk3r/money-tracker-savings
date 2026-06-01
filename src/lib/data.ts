import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  goalAllocations,
  goals,
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
    .returning();

  return created;
}

export async function getGoalsView(clerkUserId: string) {
  const db = getDb();
  const [items, allocations] = await Promise.all([
    db
      .select()
      .from(goals)
      .where(eq(goals.clerkUserId, clerkUserId))
      .orderBy(goals.sortOrder, goals.createdAt),
    db
      .select()
      .from(goalAllocations)
      .where(eq(goalAllocations.clerkUserId, clerkUserId)),
  ]);

  return items.map((goal) => ({
    ...goal,
    savedAmountMinor: allocations
      .filter((allocation) => allocation.goalId === goal.id && allocation.status !== "released")
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
          allocation.wishlistItemId === item.id && allocation.status !== "released",
      )
      .reduce((sum, allocation) => sum + allocation.targetAmountMinor, 0),
  }));
}

export async function getUnallocatedBalances(clerkUserId: string) {
  const db = getDb();
  const [transactions, goalFunds, wishlistFunds] = await Promise.all([
    db
      .select()
      .from(savingsTransactions)
      .where(eq(savingsTransactions.clerkUserId, clerkUserId)),
    db
      .select()
      .from(goalAllocations)
      .where(eq(goalAllocations.clerkUserId, clerkUserId)),
    db
      .select()
      .from(wishlistAllocations)
      .where(eq(wishlistAllocations.clerkUserId, clerkUserId)),
  ]);

  const balances = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "deposit" && transaction.type !== "release") {
      continue;
    }

    balances.set(
      transaction.currency,
      (balances.get(transaction.currency) ?? 0) + transaction.amountMinor,
    );
  }

  for (const allocation of [...goalFunds, ...wishlistFunds]) {
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

export async function getRecentTransactions(clerkUserId: string) {
  return getDb()
    .select()
    .from(savingsTransactions)
    .where(eq(savingsTransactions.clerkUserId, clerkUserId))
    .orderBy(desc(savingsTransactions.createdAt))
    .limit(8);
}

export async function getDashboardData(clerkUserId: string) {
  const [settings, balances, goalRows, wishlistRows, transactions] = await Promise.all([
    getOrCreateSettings(clerkUserId),
    getUnallocatedBalances(clerkUserId),
    getGoalsView(clerkUserId),
    getWishlistView(clerkUserId),
    getRecentTransactions(clerkUserId),
  ]);

  return {
    settings,
    balances,
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
    .where(and(eq(goals.id, goalId), eq(goals.clerkUserId, clerkUserId)))
    .limit(1);

  if (!goal) {
    throw new Error("Goal not found.");
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
        inArray(wishlistAllocations.status, ["active", "spent"]),
      ),
    )
    .orderBy(desc(wishlistAllocations.createdAt));
}
