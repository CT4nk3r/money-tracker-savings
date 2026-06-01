CREATE TYPE "public"."allocation_status" AS ENUM('active', 'released', 'spent');--> statement-breakpoint
CREATE TYPE "public"."funding_mode" AS ENUM('manual', 'top_first', 'weighted_split');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'goal_allocation', 'wishlist_allocation', 'release', 'purchase', 'correction');--> statement-breakpoint
CREATE TYPE "public"."wishlist_status" AS ENUM('active', 'ready', 'purchased', 'archived');--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" text NOT NULL,
	"quote_currency" text NOT NULL,
	"rate" numeric(24, 12) NOT NULL,
	"provider" text DEFAULT 'frankfurter' NOT NULL,
	"provider_date" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"goal_id" uuid NOT NULL,
	"source_amount_minor" bigint NOT NULL,
	"source_currency" text NOT NULL,
	"target_amount_minor" bigint NOT NULL,
	"target_currency" text NOT NULL,
	"exchange_rate_id" uuid,
	"status" "allocation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text NOT NULL,
	"target_amount_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"goal_id" uuid,
	"wishlist_item_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"display_currency" text DEFAULT 'HUF' NOT NULL,
	"default_funding_mode" "funding_mode" DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"wishlist_item_id" uuid NOT NULL,
	"source_amount_minor" bigint NOT NULL,
	"source_currency" text NOT NULL,
	"target_amount_minor" bigint NOT NULL,
	"target_currency" text NOT NULL,
	"exchange_rate_id" uuid,
	"status" "allocation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"title" text NOT NULL,
	"original_price_minor" bigint NOT NULL,
	"current_price_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"url" text,
	"notes" text,
	"rank" integer DEFAULT 1 NOT NULL,
	"status" "wishlist_status" DEFAULT 'active' NOT NULL,
	"purchased_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "public"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_wishlist_item_id_wishlist_items_id_fk" FOREIGN KEY ("wishlist_item_id") REFERENCES "public"."wishlist_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_allocations" ADD CONSTRAINT "wishlist_allocations_wishlist_item_id_wishlist_items_id_fk" FOREIGN KEY ("wishlist_item_id") REFERENCES "public"."wishlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_allocations" ADD CONSTRAINT "wishlist_allocations_exchange_rate_id_exchange_rates_id_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "public"."exchange_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exchange_rates_pair_idx" ON "exchange_rates" USING btree ("base_currency","quote_currency","provider_date");--> statement-breakpoint
CREATE INDEX "goal_allocations_user_idx" ON "goal_allocations" USING btree ("clerk_user_id","goal_id");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_idx" ON "savings_transactions" USING btree ("clerk_user_id","created_at");--> statement-breakpoint
CREATE INDEX "wishlist_allocations_user_idx" ON "wishlist_allocations" USING btree ("clerk_user_id","wishlist_item_id");--> statement-breakpoint
CREATE INDEX "wishlist_user_idx" ON "wishlist_items" USING btree ("clerk_user_id");