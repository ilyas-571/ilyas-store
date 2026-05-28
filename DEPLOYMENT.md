# Production Deployment Guide — Ilyas Store

This guide explains how to deploy the Ilyas Store monorepo to production using **Vercel** (for both the Next.js storefront and the Express API server) and **Neon** (for the database).

## Architecture Overview

- **Frontend (Storefront)**: Next.js 15 app located at `artifacts/storefront-next/`. Deployed on **Vercel** as a Next.js site.
- **Backend (API Server)**: Express 5 app located at `artifacts/api-server/`. Deployed on **Vercel** as serverless functions (configured via `vercel.json`).
- **Database**: PostgreSQL database hosted on **Neon**.

---

## Step 1: Database Setup & Migration

The application uses **Neon** for a serverless PostgreSQL database.

1. **Obtain the Connection String**:
   Get your database connection URL from the Neon Console. It should look like this:
   `postgresql://<user>:<password>@<host>/neondb?sslmode=require`

2. **Run Schema Migrations**:
   Run the schema setup script locally to verify your database is up to date:
   ```bash
   pnpm install
   # Set the DATABASE_URL and run the migrations
   DATABASE_URL="your_neon_db_url" pnpm --filter @workspace/db run push
   ```

---

## Step 2: Deploying the Express API Server (`@workspace/api-server`)

The API server runs as a Vercel Serverless Function.

1. **Deploy to Vercel**:
   - Go to your Vercel Dashboard and click **Add New** > **Project**.
   - Import your repository.
   - Set the **Root Directory** to `artifacts/api-server`.
   - Vercel will automatically detect the configuration from the `vercel.json` file in that directory.

2. **Configure Environment Variables**:
   In the Vercel project settings, add the following environment variables:
   - `DATABASE_URL`: Your Neon database connection string.
   - `SESSION_SECRET`: A secure random string used to sign JWTs (generate one using `node -e "crypto.randomBytes(32).toString('hex')"`).
   - `NEXT_PUBLIC_SITE_URL`: The URL of your Next.js storefront (e.g. `https://ilyas-store.vercel.app`).
   - `NODE_ENV`: `production`

3. **Deploy**:
   Click **Deploy**. Once finished, Vercel will provide an API deployment URL (e.g. `https://ilyas-api.vercel.app`).

---

## Step 3: Deploying the Next.js Storefront (`@workspace/storefront-next`)

The storefront is deployed as a standard Next.js project on Vercel.

1. **Deploy to Vercel**:
   - Go to your Vercel Dashboard and click **Add New** > **Project**.
   - Import the same repository.
   - Set the **Root Directory** to `artifacts/storefront-next`.

2. **Configure Environment Variables**:
   In the Vercel project settings, add the following environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Vercel API deployment URL (from Step 2) with `/api` appended (e.g. `https://ilyas-api.vercel.app/api`).
   - `INTERNAL_API_URL`: Your Vercel API deployment URL (e.g. `https://ilyas-api.vercel.app`).
   - `NEXT_PUBLIC_SITE_URL`: Your storefront's production URL (e.g. `https://ilyas-store.vercel.app`).
   - `LEGACY_VITE_ORIGIN`: (Optional) The URL of the legacy SPA if you choose to deploy it. If not set, the storefront middleware will pass requests through.
   - `NODE_ENV`: `production`

3. **Deploy**:
   Click **Deploy**.

---

## Maintenance & Logs

- **Vercel Logs**: Check the **Logs** tab in your Vercel project dashboards to monitor runtime errors and requests.
- **Database Logs**: Use the Neon Console to inspect database usage and performance.
