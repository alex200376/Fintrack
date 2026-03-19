# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Personal Finance Record iOS app with an Express backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with Expo Router

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## App Features

- **Dashboard**: Monthly financial overview with balance card, income/expense totals, donut chart breakdown, recent transactions
- **Transactions**: Full CRUD, filter by type, search by category/note, grouped by month
- **Budgets**: Set spending limits by category, real-time progress tracking with over-budget warnings
- **Settings**: Category management (view/delete), app information
- **Add Transaction**: Form to add income or expense transactions with category selection
- **Transaction Detail**: View/edit/delete individual transactions

## Database Schema

- `categories` — id, name, icon, color, type (income/expense/both), createdAt
- `transactions` — id, amount, type, categoryId, note, date, createdAt, updatedAt
- `budgets` — id, categoryId, amount, period, createdAt, updatedAt

Default categories are seeded on first API call (13 built-in categories).

## API Endpoints

- `GET /api/healthz` — health check
- `GET/POST /api/categories`
- `PUT/DELETE /api/categories/:id`
- `GET/POST /api/transactions`
- `GET/PUT/DELETE /api/transactions/:id`
- `GET/POST /api/budgets`
- `PUT/DELETE /api/budgets/:id`
- `GET /api/summary?month=&year=` — financial summary for dashboard

## Mobile App Theme

Colors: Deep navy blue primary (#4F6EF7), income green (#34C759), expense red (#FF3B30)
Font: Inter (400/500/600/700 weights)
Navigation: NativeTabs with liquid glass on iOS 26+, BlurView fallback
