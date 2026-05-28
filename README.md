# Ilyas Store — Luxury eCommerce

A production-ready full-stack luxury eCommerce web application for perfumes, watches, and cosmetics. Built as a pnpm monorepo with a Next.js storefront and an Express API backend, optimized for Vercel and Neon.

---

## Workspace Structure

```
ilyas-store/
├── artifacts/
│   ├── storefront-next/    Next.js frontend app (Tailwind CSS v4)
│   ├── ilyas-store/        Legacy Vite storefront (optional/deprecated)
│   └── api-server/         Express 5 REST API (Vercel serverless)
├── lib/
│   ├── db/                 Drizzle ORM schema + migrations
│   ├── api-spec/           OpenAPI spec
│   ├── api-client-react/   Generated React Query hooks
│   └── api-zod/            Generated Zod validation schemas
└── scripts/
    └── src/                TypeScript utilities and tools
```

---

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm v9+
- PostgreSQL database (e.g. Neon)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection URL
- `SESSION_SECRET`: Secure random string for signing JWTs
- `NEXT_PUBLIC_SITE_URL`: Frontend storefront URL
- `NEXT_PUBLIC_API_URL`: Browser-accessible API URL (e.g. `/api` or full URL)

### 3. Database Migration

Push the database schema to your database:

```bash
pnpm --filter @workspace/db run push
```

### 4. Local Development

Start the development servers:

- **Express API**: `pnpm --filter @workspace/api-server run dev`
- **Next.js Storefront**: `pnpm --filter @workspace/storefront-next run dev`

---

## key Commands

- **Typecheck**: `pnpm run typecheck` (validates TypeScript across the entire monorepo)
- **Codegen**: `pnpm run codegen` (regenerates React Query hooks and Zod schemas from OpenAPI specs)
- **Build**: `pnpm build` (builds all packages for production)

---

## Deployment

Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions on deploying the frontend and backend to Vercel and connecting them to a Neon database.
