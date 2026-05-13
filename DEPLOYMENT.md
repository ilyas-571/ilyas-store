# Production Deployment Guide

This project is now configured for production deployment to online hosting platforms. Follow this guide to deploy to your chosen hosting provider.

## Overview

The Ilyas Store consists of three main services:

1. **Backend API** (Express.js) - `artifacts/api-server/`
2. **Frontend** (Next.js) - `artifacts/storefront-next/`
3. **Database** (PostgreSQL) - Managed separately
4. **Database Schema** (Drizzle ORM) - `lib/db/`

## Pre-Deployment Checklist

- [ ] Remove all `.env` files from version control (already in .gitignore)
- [ ] Generate a strong SESSION_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set up PostgreSQL database in your hosting provider
- [ ] Obtain database connection string (DATABASE_URL)
- [ ] Choose production domain name
- [ ] Configure DNS records
- [ ] Set up SSL/TLS certificates (usually automatic with modern hosting)

## Environment Variables

Copy `.env.production.example` and set all required variables. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed descriptions.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for session signing
- `NEXT_PUBLIC_SITE_URL` - Your production domain
- `NEXT_PUBLIC_API_URL` - API endpoint accessible from browser
- `INTERNAL_API_URL` - Internal API URL for backend
- `NODE_ENV=production`

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend on Vercel:
```bash
# 1. Push to GitHub/GitLab
git push origin main

# 2. Connect Vercel to your repository
# - Go to https://vercel.com/import
# - Select root directory: "artifacts/storefront-next"
# - Set environment variables (from .env.production.example)

# 3. Deploy
# Vercel auto-deploys on git push
```

#### Backend on Railway:
```bash
# 1. Install Railway CLI: https://railway.app/
# railway login

# 2. Create project and add PostgreSQL
# railway init
# railway add --postgres

# 3. Set environment variables
# railway variables set DATABASE_URL="your-connection-string"
# railway variables set SESSION_SECRET="your-secret"
# railway variables set NODE_ENV="production"

# 4. Deploy from artifacts/api-server/
# cd artifacts/api-server
# railway up
```

### Option 2: Heroku (Legacy but still viable)

```bash
# 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

# 2. Create app for backend
heroku login
heroku create your-app-api

# 3. Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# 4. Set environment variables
heroku config:set SESSION_SECRET="your-secret"
heroku config:set NODE_ENV="production"

# 5. Deploy
cd artifacts/api-server
git push heroku main

# 6. For frontend, deploy to Vercel or Netlify separately
```

### Option 3: Docker Compose (Self-Hosted VPS)

```bash
# 1. Install Docker & Docker Compose on your server

# 2. Create docker-compose.yml at project root:
# See docker-compose.yml.example below

# 3. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your actual values

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Run database migrations
docker-compose exec api-server npm run db:migrate

# 6. Check logs
docker-compose logs -f
```

### Option 4: AWS (ECS + RDS)

```bash
# 1. Set up ECR repositories
aws ecr create-repository --repository-name ilyas-api
aws ecr create-repository --repository-name ilyas-storefront

# 2. Build and push Docker images
docker build -t ilyas-api artifacts/api-server
docker tag ilyas-api:latest [account-id].dkr.ecr.[region].amazonaws.com/ilyas-api:latest
docker push [account-id].dkr.ecr.[region].amazonaws.com/ilyas-api:latest

# 3. Create RDS PostgreSQL database
# Use AWS Console or AWS CLI

# 4. Set up ECS task definitions and services

# 5. Configure Application Load Balancer
```

## Database Setup

### Initial Migration

```bash
# 1. Run database migrations (ensure DATABASE_URL is set)
cd lib/db
npm run migrate

# 2. Or manually:
pnpm install
DATABASE_URL="your-connection-string" npx drizzle-kit migrate
```

### Seed Data (Production)

The project is shipped **without seed data**. To add initial products/data:

1. Set up a local development environment
2. Use the admin API endpoints to create products
3. Or write custom seed scripts for your data

## Build and Deploy Commands

### Build for Production

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific packages
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/storefront-next build
```

### Start Services

```bash
# Production start (backend)
cd artifacts/api-server
npm start

# Frontend is typically deployed separately and auto-builds/deploys
```

## Production Best Practices

### Security

- ✅ All localhost references removed from code
- ✅ Environment-only configuration required
- ✅ Security headers configured (CSP, HSTS, COOP, CORP, Trusted Types)
- ⚠️ Always use HTTPS in production
- ⚠️ Rotate SESSION_SECRET periodically
- ⚠️ Use strong database passwords
- ⚠️ Keep dependencies updated: `pnpm audit`

### Performance

- ✅ API requests have 5-second timeout
- ✅ Next.js image optimization enabled
- ✅ Compression middleware configured
- ✅ React Query configured for caching
- ✅ Database queries optimized with Drizzle ORM
- ⚠️ Monitor Core Web Vitals in production
- ⚠️ Use CDN for static assets
- ⚠️ Enable database query logging for optimization

### Monitoring & Logging

- Set up application error logging (e.g., Sentry, LogRocket)
- Monitor database performance
- Track API response times
- Set up uptime monitoring
- Configure alerts for errors and downtime

## Troubleshooting

### "Cannot connect to database"
- Verify `DATABASE_URL` is set correctly
- Check database credentials and permissions
- Ensure firewall allows connections from your app
- Test connection: `psql "$DATABASE_URL"`

### "API not responding from frontend"
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS headers in backend
- Ensure API is deployed and running
- Check browser console for specific errors

### "NEXT_PUBLIC_SITE_URL is empty"
- Verify `NEXT_PUBLIC_SITE_URL` is set in build environment
- Some hosting providers require explicit environment setup
- Clear build cache and redeploy

### "SESSION_SECRET not set"
- Backend requires SESSION_SECRET for session signing
- Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Set in hosting provider's environment variables

## Maintenance

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Check for vulnerabilities
pnpm audit
```

### Scaling

- Add database read replicas for high traffic
- Use Redis for session storage and caching
- Implement API rate limiting (already in code)
- Consider CDN for static assets
- Use horizontal scaling (multiple app instances)

## Support

For issues or questions:
1. Check logs: `docker logs` or hosting provider dashboard
2. Review this guide and .env.production.example
3. Check browser console and Network tab
4. Verify all environment variables are set correctly
