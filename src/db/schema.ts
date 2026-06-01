import {
  bigint,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const fundingModeEnum = pgEnum("funding_mode", [
  "manual",
  "top_first",
  "weighted_split",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "paused",
  "completed",
  "archived",
]);

export const wishlistStatusEnum = pgEnum("wishlist_status", [
  "active",
  "ready",
  "purchased",
  "archived",
]);

export const allocationStatusEnum = pgEnum("allocation_status", [
  "active",
  "released",
  "spent",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "goal_allocation",
  "wishlist_allocation",
  "release",
  "purchase",
  "correction",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const userSettings = pgTable("user_settings", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  displayCurrency: text("display_currency").default("HUF").notNull(),
  defaultFundingMode: fundingModeEnum("default_funding_mode")
    .default("manual")
    .notNull(),
  ...timestamps,
});

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseCurrency: text("base_currency").notNull(),
    quoteCurrency: text("quote_currency").notNull(),
    rate: numeric("rate", { precision: 24, scale: 12 }).notNull(),
    provider: text("provider").default("frankfurter").notNull(),
    providerDate: text("provider_date").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("exchange_rates_pair_idx").on(
      table.baseCurrency,
      table.quoteCurrency,
      table.providerDate,
    ),
  ],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    name: text("name").notNull(),
    targetAmountMinor: bigint("target_amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    status: goalStatusEnum("status").default("active").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("goals_user_idx").on(table.clerkUserId)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    title: text("title").notNull(),
    originalPriceMinor: bigint("original_price_minor", { mode: "number" }).notNull(),
    currentPriceMinor: bigint("current_price_minor", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    url: text("url"),
    notes: text("notes"),
    rank: integer("rank").default(1).notNull(),
    status: wishlistStatusEnum("status").default("active").notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("wishlist_user_idx").on(table.clerkUserId)],
);

export const savingsTransactions = pgTable(
  "savings_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    type: transactionTypeEnum("type").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    wishlistItemId: uuid("wishlist_item_id").references(() => wishlistItems.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("transactions_user_idx").on(table.clerkUserId, table.createdAt)],
);

export const goalAllocations = pgTable(
  "goal_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    goalId: uuid("goal_id")
      .references(() => goals.id, { onDelete: "cascade" })
      .notNull(),
    sourceAmountMinor: bigint("source_amount_minor", { mode: "number" }).notNull(),
    sourceCurrency: text("source_currency").notNull(),
    targetAmountMinor: bigint("target_amount_minor", { mode: "number" }).notNull(),
    targetCurrency: text("target_currency").notNull(),
    exchangeRateId: uuid("exchange_rate_id").references(() => exchangeRates.id, {
      onDelete: "set null",
    }),
    status: allocationStatusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (table) => [index("goal_allocations_user_idx").on(table.clerkUserId, table.goalId)],
);

export const wishlistAllocations = pgTable(
  "wishlist_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    wishlistItemId: uuid("wishlist_item_id")
      .references(() => wishlistItems.id, { onDelete: "cascade" })
      .notNull(),
    sourceAmountMinor: bigint("source_amount_minor", { mode: "number" }).notNull(),
    sourceCurrency: text("source_currency").notNull(),
    targetAmountMinor: bigint("target_amount_minor", { mode: "number" }).notNull(),
    targetCurrency: text("target_currency").notNull(),
    exchangeRateId: uuid("exchange_rate_id").references(() => exchangeRates.id, {
      onDelete: "set null",
    }),
    status: allocationStatusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (table) => [
    index("wishlist_allocations_user_idx").on(
      table.clerkUserId,
      table.wishlistItemId,
    ),
  ],
);
