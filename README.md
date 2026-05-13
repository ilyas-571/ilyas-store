# Ilyas Store — Luxury eCommerce

A production-ready full-stack luxury eCommerce web application for perfumes, watches, and cosmetics. Built as a pnpm monorepo with Next.js storefront and an Express API backend.

---

## 🚀 Deployment Guides (Pick Your Path)

**🎯 FIRST TIME DEPLOYING?**
- **[📚 START HERE: Deployment Index](./GETTING_STARTED.md)** — Pick your path (30min? 60min? All options?)
- **[⚡ QUICK START (30 min)](./QUICK_START.md)** — Fastest deployment for beginners (copy-paste)

**DETAILED WALKTHROUGHS:**
- **[🎉 FREE Deployment Step-by-Step](./FREE_DEPLOYMENT.md)** — Detailed guide (Vercel + Railway)
- **[✅ Deployment Checklist](./DEPLOY_CHECKLIST.md)** — Checkbox tracking + troubleshooting
- **[📋 Deployment Index](./GETTING_STARTED.md)** — Guide picker + reading order

**REFERENCE GUIDES:**
- **[All Deployment Options](./DEPLOYMENT.md)** — Vercel, Railway, Heroku, AWS, Docker, self-hosted
- **[Environment Variables](./ENV_SETUP.md)** — Configuration reference
- **[Production Ready Summary](./PRODUCTION_READY.md)** — What was changed in project
- **[Build Instructions](#build-for-production)** — Build for production locally

---

## Features

- **Storefront** — Homepage hero, category browsing, product detail, search & filter
- **Cart & Checkout** — Multi-step checkout with postal code, landmark, order notes, COD
- **Order History** — Expandable orders with printable invoice page
- **Auth** — JWT-based login/register (bcrypt passwords)
- **Admin Panel** — Full dashboard with:
  - Products, Categories, Banners management
  - Order management with status updates
  - User management
  - Coupon / discount codes
  - Store settings with logo uploader
  - Revenue charts and analytics
- **SEO Optimized** — Canonical URLs, Open Graph, structured data (JSON-LD)
- **Production Ready** — Security headers, performance optimized, database optimized

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Next.js 15, TypeScript, Tailwind CSS v4 |
| Backend | Express 5, Node.js 18+, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT (jsonwebtoken + bcrypt) |
| API Contract | OpenAPI → Orval (React Query hooks + Zod schemas) |
| Monorepo | pnpm workspaces |
| Deployment | Vercel, Railway, Docker, self-hosted |

---

## Project Structure

```
ilyas-store/
├── artifacts/
│   ├── storefront-next/    Next.js frontend app
│   ├── ilyas-store/        Legacy Vite storefront (deprecated)
│   └── api-server/         Express 5 REST API
├── lib/
│   ├── db/                 Drizzle ORM schema + migrations
│   ├── api-spec/           OpenAPI spec
│   ├── api-client-react/   Generated React Query hooks
│   └── api-zod/            Generated Zod validation schemas
└── scripts/
    └── src/                TypeScript utilities (generate, type-check)
```

---

## Build for Production

### Prerequisites

- Node.js v18 or higher
- pnpm v9+
- PostgreSQL database (create one first)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Environment Variables

Copy `.env.production.example` to `.env.production` and set all required variables:

```bash
cp .env.production.example .env
# Edit .env with your production values
```

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Strong random string (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `NEXT_PUBLIC_SITE_URL` - Your production domain (e.g., `https://yourdomain.com`)
- `NEXT_PUBLIC_API_URL` - API endpoint (e.g., `https://yourdomain.com/api`)
- `INTERNAL_API_URL` - Internal API URL for server-to-server (e.g., `http://localhost:5000`)
- `NODE_ENV=production`

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed variable descriptions.

### 3. Run Database Migrations

```bash
cd lib/db
DATABASE_URL="your-connection-string" npx drizzle-kit migrate
```

### 4. Build

```bash
pnpm build
```

### 5. Deploy

Follow the [Production Deployment Guide](./DEPLOYMENT.md) for your chosen platform:
- **Vercel** (recommended for Next.js) + Railway/Heroku for backend
- **Heroku** (all-in-one, free tier deprecated)
- **AWS ECS + RDS** (enterprise)
- **Docker + self-hosted** (full control)

---

## Deployment Platforms

### 🎯 Recommended: Vercel + Railway

**Next.js Frontend on Vercel:**
- Free tier, auto-deploys on git push
- Automatic SSL/TLS
- Optimized for Next.js

**Express Backend on Railway:**
- Built-in PostgreSQL
- Easy environment variable setup
- Pay-as-you-go pricing

See [DEPLOYMENT.md](./DEPLOYMENT.md#option-1-vercel--railway-recommended) for step-by-step instructions.

---

## Production Checklist

Before deploying:

- [ ] All environment variables set (see [ENV_SETUP.md](./ENV_SETUP.md))
- [ ] DATABASE_URL connection verified
- [ ] SESSION_SECRET generated (strong random string)
- [ ] NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_API_URL configured
- [ ] Database migrations completed
- [ ] Build succeeds locally: `pnpm build`
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] Security headers configured (already done in code)
- [ ] HTTPS enabled on domain
- [ ] DNS records pointing to your deployment

---

## Security Features

✅ **Already Configured:**
- Content Security Policy (CSP) header
- HTTP Strict Transport Security (HSTS)
- Cross-Origin-Opener-Policy (COOP)
- Cross-Origin-Resource-Policy (CORP)
- Trusted Types enforcement
- No localhost/development hardcoding in production builds
- Database credentials via environment only
- Session signing with strong SECRET

⚠️ **Your Responsibility:**
- Keep environment variables secure (use hosting provider's secret manager)
- Rotate SESSION_SECRET periodically
- Use strong database passwords
- Keep dependencies updated: `pnpm audit`
- Monitor error logs
- Enable HTTPS everywhere

---

## Performance Metrics

Optimized for Lighthouse and Core Web Vitals:

- ✅ API requests timeout after 5 seconds (prevents hanging)
- ✅ React Query configured for smart caching
- ✅ Next.js image optimization enabled
- ✅ Compression middleware for responses
- ✅ Database indexes on frequently queried columns
- ✅ Rate limiting on API endpoints

---

## Support & Issues

For deployment issues:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for your platform
2. Review [ENV_SETUP.md](./ENV_SETUP.md) to verify environment variables
3. Check application logs on your hosting platform
4. Verify database connection: `psql "$DATABASE_URL"`
5. Test API manually: `curl "$NEXT_PUBLIC_API_URL/api/health"`

---

## License

MIT

---

**Ready to deploy?** Start with [DEPLOYMENT.md](./DEPLOYMENT.md)

## Database

The full database (schema + seed data) is stored in `database/dump.sql`.

To restore it manually:
```bash
psql $DATABASE_URL -f database/dump.sql
```

To re-generate the dump (e.g. after adding more data):
```bash
pg_dump $DATABASE_URL --no-owner --no-acl --clean --if-exists -f database/dump.sql
```

To push schema changes after editing `lib/db/src/schema/`:
```bash
pnpm --filter @workspace/db run push
```

---

## API

All endpoints are under `/api`. The full contract is defined in `lib/api-spec/openapi.yaml`.

| Group | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Products | `GET /api/products`, `GET /api/products/:id`, `GET /api/products/featured` |
| Categories | `GET /api/categories` |
| Orders | `GET /api/orders/my`, `POST /api/orders`, `GET /api/orders/:id` |
| Admin | `/api/orders`, `/api/products`, `/api/categories`, `/api/users`, `/api/banners`, `/api/coupons`, `/api/settings`, `/api/dashboard/*` |

To regenerate the API client after editing the OpenAPI spec:
```bash
pnpm run codegen
```

---

## Key Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API hooks + Zod schemas from OpenAPI spec
pnpm run codegen

# Push DB schema changes to the database
pnpm --filter @workspace/db run push

# Re-dump the database
pg_dump $DATABASE_URL --no-owner --no-acl --clean --if-exists -f database/dump.sql
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, categories, featured products |
| `/products` | All products with search & category filter |
| `/products/:id` | Product detail with reviews |
| `/cart` | Shopping cart + multi-step checkout |
| `/orders` | Order history (login required) |
| `/orders/:id/print` | Printable invoice page |
| `/login` | Sign in |
| `/register` | Create account |
| `/admin` | Admin dashboard |
| `/admin/products` | Manage products |
| `/admin/categories` | Manage categories |
| `/admin/orders` | Manage orders |
| `/admin/users` | Manage users |
| `/admin/banners` | Manage homepage banners |
| `/admin/coupons` | Manage discount coupons |
| `/admin/settings` | Store settings + logo uploader |

---

## License

MIT — free to use and modify.
