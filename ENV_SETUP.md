# Environment Variables Setup Guide

This guide explains every environment variable used in the Ilyas Store application and how to set them for production.

## Required Variables

### DATABASE_URL (Required)

**What it is:** PostgreSQL database connection string

**Format:** `postgresql://username:password@host:port/database_name`

**Example:**
```
postgresql://admin:MySecureP@ss123@db.example.com:5432/ilyas_store
```

**How to get it:**
- **Heroku:** `heroku config` after adding PostgreSQL addon
- **Railway:** Shown in dashboard, copy connection string
- **AWS RDS:** Build from endpoint, username, password, port, database name
- **PlanetScale/CockroachDB:** Provided in connection string format
- **Self-hosted:** `postgresql://user:password@localhost:5432/ilyas_store`

**Important:**
- Always use strong passwords
- Never commit actual DATABASE_URL to version control
- Database must exist before app starts
- User must have permissions to create tables (for migrations)

---

### SESSION_SECRET (Required)

**What it is:** Random string used to sign session cookies

**Length:** Minimum 32 characters (64+ recommended)

**Generate one:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example:**
```
a3f8c2b1e4d7a9c6f2b5e8a1d3c6f9b2e4a7c0d3f6a9c2e5b8f1a4d7c0e3
```

**Important:**
- Never commit to version control
- Change periodically (invalidates all sessions)
- Use different value per environment (dev, staging, prod)
- Different instances should use same SECRET

---

### NODE_ENV (Required)

**What it is:** Deployment environment indicator

**Allowed values:**
- `"production"` - Production deployment (recommended)
- `"staging"` - Staging/test environment
- `"development"` - Local development (default)

**Examples:**
```bash
NODE_ENV="production"
```

**Important:**
- Must be set to "production" in production
- Affects performance optimizations, error logging, security headers
- Next.js uses this for build optimizations
- Express uses this for middleware configuration

---

### PORT (Optional)

**What it is:** Backend API server port

**Default:** `5000`

**Examples:**
```bash
PORT="5000"
PORT="8080"
PORT="3000"
```

**Important:**
- Most hosting platforms override this (Heroku, Railway, Render)
- Port must not conflict with other services
- Often handled automatically by platform

---

## Frontend Variables (Next.js)

### NEXT_PUBLIC_SITE_URL (Required)

**What it is:** Your production website domain URL

**Format:** `https://domain.com` (without trailing slash)

**Examples:**
```bash
NEXT_PUBLIC_SITE_URL="https://ilyas-store.com"
NEXT_PUBLIC_SITE_URL="https://www.mystore.com"
NEXT_PUBLIC_SITE_URL="https://shop.example.com"
```

**Used for:**
- Canonical URLs (SEO)
- Open Graph metadata
- Sitemap generation
- Robots.txt URL references
- Absolute URL redirects

**Important:**
- Must start with `https://` (not http://)
- Should NOT have trailing slash
- Used by Next.js at build time for SSG
- If empty, metadata will fail

---

### NEXT_PUBLIC_API_URL (Required)

**What it is:** URL where frontend can reach the API

**Format:** URL accessible from browser (public)

**Examples:**
```bash
# API on same domain
NEXT_PUBLIC_API_URL="https://ilyas-store.com/api"

# API on subdomain
NEXT_PUBLIC_API_URL="https://api.ilyas-store.com"

# API on separate domain
NEXT_PUBLIC_API_URL="https://backend-api.example.com"
```

**Used for:**
- Client-side fetch requests
- React Query API calls
- Browser HTTP requests

**Important:**
- Must be publicly accessible
- Can be same domain with `/api` rewrite or separate domain
- No trailing slash
- If empty, API calls will fail in browser

---

### INTERNAL_API_URL (Required)

**What it is:** Internal URL for backend-to-frontend server-side communication

**Format:** URL accessible from Next.js server

**Examples:**
```bash
# Local development
INTERNAL_API_URL="http://localhost:5000"

# Same container/network
INTERNAL_API_URL="http://api-server:5000"

# Same host, different port
INTERNAL_API_URL="http://127.0.0.1:5000"

# Production (usually localhost on same VM)
INTERNAL_API_URL="http://localhost:5000"
```

**Used for:**
- Next.js server-side fetch requests
- Rendering pages with data
- Sitemap/robots.txt generation
- Server-to-server communication

**Important:**
- Does NOT need to be public
- Can use private/internal URLs
- Next.js middleware uses this for legacy routing
- Critical for SSR to work

---

## Optional Variables

### LEGACY_VITE_ORIGIN (Optional)

**What it is:** URL of legacy Vite app for routing unmigrated pages

**Default:** Empty (no legacy routing)

**Examples:**
```bash
LEGACY_VITE_ORIGIN="http://localhost:3000"
```

**Used for:**
- Redirecting to old Vite app if pages not migrated
- Only needed during migration period

**Important:**
- Leave empty if no legacy pages remain
- Not needed in production
- Development only

---

### Email Configuration (Optional)

**For transactional emails:**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM="noreply@yourdomain.com"
```

---

### Storage Configuration (Optional)

**For cloud file uploads (AWS S3, etc):**
```bash
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

---

## Setting Environment Variables

### Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select which environments (Production/Preview/Development)
4. Redeploy

```
NEXT_PUBLIC_SITE_URL: https://yourdomain.com
NEXT_PUBLIC_API_URL: https://yourdomain.com/api
INTERNAL_API_URL: http://localhost:5000
```

### Railway

```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set SESSION_SECRET="your-secret"
railway variables set NODE_ENV="production"
railway variables set PORT="5000"
```

### Heroku

```bash
heroku config:set SESSION_SECRET="your-secret"
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set NODE_ENV="production"
```

### Docker/Docker Compose

Create `.env` file:
```bash
DATABASE_URL="postgresql://..."
SESSION_SECRET="your-secret"
NODE_ENV="production"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
INTERNAL_API_URL="http://localhost:5000"
```

Or pass via CLI:
```bash
docker run -e DATABASE_URL="..." -e SESSION_SECRET="..." myimage
```

### GitHub Actions (CI/CD)

```yaml
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
```

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All REQUIRED variables are set
- [ ] `DATABASE_URL` connection works: `psql "$DATABASE_URL"`
- [ ] `SESSION_SECRET` is strong (32+ random characters)
- [ ] `NODE_ENV="production"`
- [ ] `NEXT_PUBLIC_SITE_URL` uses HTTPS
- [ ] `NEXT_PUBLIC_SITE_URL` has no trailing slash
- [ ] `NEXT_PUBLIC_API_URL` is accessible from browser
- [ ] `INTERNAL_API_URL` is accessible from server
- [ ] Database migrations ran successfully
- [ ] No localhost references in config
- [ ] Sensitive values NOT in version control
- [ ] Different values per environment (dev vs prod)

---

## Common Issues

### Error: "Cannot connect to database"
- [ ] Check DATABASE_URL is set
- [ ] Verify database exists
- [ ] Check credentials (user/password)
- [ ] Check host/port are correct
- [ ] Verify firewall allows connections

### Error: "API not responding"
- [ ] Check NEXT_PUBLIC_API_URL is correct
- [ ] Verify API is running and accessible
- [ ] Check browser console for specific error
- [ ] Verify CORS is configured

### Error: "NEXT_PUBLIC_SITE_URL is empty"
- [ ] Set NEXT_PUBLIC_SITE_URL before building
- [ ] Clear build cache and rebuild
- [ ] Verify it's not overwritten somewhere
- [ ] Check it's available at build time (not runtime-only)

### Sessions not persisting
- [ ] Check SESSION_SECRET is set
- [ ] Verify cookie domain matches NEXT_PUBLIC_SITE_URL
- [ ] Check browser allows cookies
- [ ] Verify SESSION_SECRET is same across all instances

---

## Security Best Practices

1. **Never commit secrets** - Use hosting provider's secure environment variables
2. **Use `.env.local`** - Never commit `.env` files
3. **Rotate secrets regularly** - Especially SESSION_SECRET
4. **Use strong passwords** - Especially for DATABASE_URL
5. **Limit database permissions** - Use read-only replicas where possible
6. **Monitor access logs** - Watch for suspicious database connections
7. **Keep dependencies updated** - Run `pnpm audit` regularly
8. **Use HTTPS everywhere** - All URLs must be HTTPS in production
