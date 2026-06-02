CREATE TYPE "public"."account_invite_status" AS ENUM('pending', 'accepted', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."account_member_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "savings_account_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"invited_email" text NOT NULL,
	"invited_by_clerk_user_id" text NOT NULL,
	"accepted_by_clerk_user_id" text,
	"status" "account_invite_status" DEFAULT 'pending' NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_account_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text,
	"role" "account_member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by_clerk_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "savings_account_invites" ADD CONSTRAINT "savings_account_invites_account_id_savings_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."savings_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_account_members" ADD CONSTRAINT "savings_account_members_account_id_savings_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."savings_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_invites_account_idx" ON "savings_account_invites" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_invites_email_idx" ON "savings_account_invites" USING btree ("invited_email","status");--> statement-breakpoint
CREATE INDEX "account_members_account_idx" ON "savings_account_members" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_members_user_idx" ON "savings_account_members" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "savings_accounts_creator_idx" ON "savings_accounts" USING btree ("created_by_clerk_user_id");--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_account_id_savings_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."savings_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_account_id_savings_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."savings_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_account_id_savings_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."savings_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_allocations_account_idx" ON "goal_allocations" USING btree ("account_id","goal_id");--> statement-breakpoint
CREATE INDEX "goals_account_idx" ON "goals" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_account_idx" ON "savings_transactions" USING btree ("account_id","created_at");