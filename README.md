# Savings Ledger

A Next.js web app for tracking savings, goals, and ranked wishlist purchases across multiple currencies.

## Features

- Clerk registration and sign-in.
- Neon Postgres persistence through Drizzle ORM.
- Deposits in multiple currencies, stored as integer minor units.
- Goal funding with per-allocation exchange-rate snapshots.
- Ranked wishlist items with manual, top-item-first, or weighted-split funding.
- Discount handling through wishlist price updates that release excess allocation back to savings.
- Global display currency for dashboard totals.
- Frankfurter live FX rates with database caching.

## Stack

- Next.js App Router
- React 19
- Tailwind CSS v4
- shadcn/ui
- Clerk
- Neon Postgres
- Drizzle ORM
- Vitest

## Environment

Copy the template and fill the values from Clerk and Neon:

```bash
cp .env.example .env.local
```

Required keys:

```bash
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Database

Generate migrations after schema changes:

```bash
npm run db:generate
```

Push the schema to Neon:

```bash
npm run db:push
```

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For local build verification without real secrets, use syntactically valid placeholder env values only for compilation checks. Real Clerk and Neon credentials are required to use authenticated app routes.
