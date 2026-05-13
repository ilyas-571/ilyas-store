# 🎉 FREE Deployment Guide - Step by Step

Deploy Ilyas Store **completely free** using Vercel (Frontend) + Railway (Backend + Database).

**Total Cost: $0** (both platforms offer free tiers with generous limits)

---

## 📋 Prerequisites (5 minutes)

Install these first:

1. **Git** — https://git-scm.com/download/win (Windows)
   - Or: `brew install git` (macOS)

2. **Node.js v18+** — https://nodejs.org
   - Verify: `node --version` (should be v18+)

3. **pnpm** — Run in terminal:
   ```bash
   npm install -g pnpm
   ```

4. **GitHub Account** — Free account at https://github.com/signup

5. **Vercel Account** — Free account at https://vercel.com (sign up with GitHub)

6. **Railway Account** — Free account at https://railway.app (sign up with GitHub)

---

## ✅ Step 1: Initialize Git & GitHub Repository (10 minutes)

### 1.1 Initialize Local Git Repository

Open terminal in your project folder:

```bash
cd c:\Users\FAWAD ALI\Downloads\ilyas-store
git init
git add .
git commit -m "Initial commit: Production-ready Ilyas Store"
```

### 1.2 Create GitHub Repository

1. Go to **https://github.com/new**
2. Fill in:
   - **Repository name**: `ilyas-store` (or any name)
   - **Description**: "Luxury eCommerce with Next.js + Express"
   - **Public** or **Private** (your choice)
   - **DO NOT** initialize with README (we have one)
3. Click **Create repository**

### 1.3 Push Code to GitHub

After creating the repository, GitHub shows you these commands. Copy and run them:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ilyas-store.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**Verify:** Go to https://github.com/YOUR_USERNAME/ilyas-store and confirm your code is there.

---

## ✅ Step 2: Database Setup on Railway (5 minutes)

Railway gives you free PostgreSQL. Here's how:

### 2.1 Create Railway Project

1. Go to **https://railway.app/dashboard**
2. Click **New Project**
3. Select **Create New → Provision PostgreSQL**
4. Wait for database to spin up (1-2 minutes)

### 2.2 Get Database Connection String

1. In Railway, click on the **PostgreSQL** service
2. Go to **Connect** tab
3. Copy the connection string that looks like:
   ```
   postgresql://postgres:[password]@[host]:[port]/railway
   ```

**Save this** — you'll need it in Step 3.

### 2.3 Run Database Migrations

On your local machine:

```bash
cd lib/db
DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/railway" npx drizzle-kit migrate
```

Replace the connection string with the one from Railway.

If you see "✓ Migrations applied successfully" — you're good!

---

## ✅ Step 3: Deploy Backend on Railway (10 minutes)

### 3.1 Create Express Service on Railway

1. Go back to **https://railway.app/dashboard**
2. Click your project
3. Click **New Service**
4. Select **GitHub Repo**
5. Connect GitHub (authorize Railway)
6. Select `ilyas-store` repository
7. Select **Configure** → **Root Directory: `artifacts/api-server`**
8. Click **Deploy**

### 3.2 Set Environment Variables

While service is deploying:

1. Click on the **Express API** service in Railway
2. Go to **Variables** tab
3. Add these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste from Step 2.2) |
| `SESSION_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste result |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `NEXT_PUBLIC_SITE_URL` | (leave blank for now, we'll get it in Step 4) |
| `NEXT_PUBLIC_API_URL` | (leave blank for now) |

### 3.3 Get Backend URL

1. Click on the Express service
2. Go to **Settings**
3. Find **Domains** section
4. Copy the domain (looks like `ilyas-store-api-production.up.railway.app`)

**Save this** — you need it for frontend in Step 4.

### 3.4 Update Backend Environment Variables

1. Go back to **Variables** tab
2. Update these:
   - `NEXT_PUBLIC_API_URL` = `https://[your-api-domain-from-3.3]/api`
   - `INTERNAL_API_URL` = `http://localhost:5000` (keeps working during local dev, ignored in production)

---

## ✅ Step 4: Deploy Frontend on Vercel (10 minutes)

### 4.1 Connect Vercel to GitHub

1. Go to **https://vercel.com/new**
2. Click **Continue with GitHub**
3. Authorize Vercel to access your repositories
4. Search for `ilyas-store` repository
5. Click **Import**

### 4.2 Configure Project

Vercel asks you to configure:

1. **Framework Preset**: Leave as `Next.js`
2. **Root Directory**: Click **Edit** and set to `artifacts/storefront-next`
3. **Environment Variables**: Add these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://[vercel-domain].vercel.app` (you'll get this after first deploy, so use it after) |
| `NEXT_PUBLIC_API_URL` | `https://[your-api-domain-from-step-3.3]/api` |
| `INTERNAL_API_URL` | `http://localhost:5000` |

For `NEXT_PUBLIC_SITE_URL`, Vercel generates a domain like `ilyas-store.vercel.app`. You can:
- Deploy first, get the domain, then update
- OR manually set to `https://yourdomain.com` if using custom domain

### 4.3 Deploy

1. Click **Deploy** button
2. Vercel builds and deploys (2-5 minutes)
3. When done, you get a URL: `https://ilyas-store.vercel.app` (or similar)

### 4.4 Update Frontend Environment Variable

1. After deployment completes, go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_SITE_URL` to your Vercel URL
3. Click **Redeploy** to apply changes

---

## ✅ Step 5: Final Configuration (5 minutes)

### 5.1 Connect Frontend to Backend

Update environment variables on Vercel:

1. Go to **https://vercel.com/dashboard**
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Update:
   - `NEXT_PUBLIC_API_URL` = `https://[api-domain-from-step-3.3]/api`
   - `NEXT_PUBLIC_SITE_URL` = `https://[your-vercel-domain].vercel.app`

5. Click **Redeploy** to apply changes

### 5.2 Verify Backend is Running

1. Open your API domain in browser:
   ```
   https://[your-api-domain]/api/health
   ```
2. Should return JSON response (not an error)

### 5.3 Test the Full App

1. Visit your Vercel domain: `https://your-app.vercel.app`
2. You should see the Ilyas Store homepage
3. Try adding items to cart
4. Try browsing products

---

## 🎯 Troubleshooting

### Frontend shows blank page
- Check browser console (F12) for errors
- Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
- Redeploy on Vercel

### "Cannot fetch products"
- Verify backend is running: Visit `/api/health`
- Check `NEXT_PUBLIC_API_URL` is correct
- Check backend logs on Railway

### Database connection error
- Verify `DATABASE_URL` is correct in Railway
- Ensure migrations ran successfully
- Check Railway PostgreSQL service is running

### Railway backend not building
- Check build logs in Railway dashboard
- Verify `artifacts/api-server` folder exists in GitHub
- Try manual rebuild: Click service → **Deploy** → **Redeploy**

### Vercel build failed
- Check build logs at **Deployments** → Click the failed build
- Verify `Root Directory` is `artifacts/storefront-next`
- Ensure all environment variables are set

---

## 📱 Custom Domain (Optional, Free)

### Free Domain Option:
- **Freenom**: https://www.freenom.com (free .tk, .ml, .ga domains)
- **Namecheap**: https://www.namecheap.com ($0.88/year)

### Connect to Vercel:
1. Buy domain
2. Go to Vercel → **Settings** → **Domains**
3. Add your domain
4. Follow Vercel's DNS instructions

---

## 🔄 Auto-Deploy on GitHub Push

Both Vercel and Railway automatically deploy when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update: Fixed checkout page"
git push origin main

# Vercel and Railway automatically rebuild and deploy!
# Check deployment status:
# - Vercel: https://vercel.com/dashboard → Your project
# - Railway: https://railway.app/dashboard → Your project
```

---

## 📊 Free Tier Limits (Should Be Enough)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Vercel** | Unlimited deployments | None for hobby projects |
| **Railway** | $5/month credit | Enough for small store |
| **PostgreSQL** | Free on Railway | 50 GB storage |
| **GitHub** | Unlimited repos | Private & public |

**Note:** If you exceed Railway's $5/month, you can add a payment method. For a small store with low traffic, it should stay free.

---

## ✅ Complete Checklist

- [ ] Git installed (`git --version`)
- [ ] Node.js v18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] GitHub repository created and code pushed
- [ ] Railway PostgreSQL created
- [ ] Database migrations ran successfully
- [ ] Backend deployed on Railway with variables set
- [ ] Backend domain works (`/api/health` returns JSON)
- [ ] Frontend deployed on Vercel with variables set
- [ ] Frontend loads without errors
- [ ] Products display on homepage
- [ ] Cart functionality works
- [ ] Both services auto-update on git push

---

## 📞 Quick Reference

### Your Production URLs
```
Frontend: https://[your-vercel-domain].vercel.app
Backend API: https://[your-railway-domain].up.railway.app
Database: Managed on Railway (no direct URL needed)
```

### Your GitHub Repository
```
https://github.com/[YOUR_USERNAME]/ilyas-store
```

### Dashboard Links
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **GitHub Repository**: https://github.com/settings/repositories

---

## 🚀 Next Steps

1. **Monitor your deployment**:
   - Check Vercel and Railway dashboards daily (free tier has generous limits)
   - Monitor database usage on Railway

2. **Set up error logging** (optional but recommended):
   - Sentry (free tier): https://sentry.io
   - LogRocket (free tier): https://logrocket.com

3. **Custom domain** (optional):
   - Follow the "Custom Domain" section above

4. **Add more features**:
   - Email notifications (set up SMTP in backend)
   - Payment processing (add Stripe integration)
   - Analytics

---

## 💰 Total Cost

| Service | Monthly Cost |
|---------|--------|
| Vercel | **$0** (free tier forever) |
| Railway | **$0** (with $5/month credit) |
| GitHub | **$0** (free) |
| Database | **$0** (included with Railway) |
| **Total** | **$0** ✅ |

**You're now running a production eCommerce store completely FREE!** 🎉

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **GitHub Docs**: https://docs.github.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Express Deployment**: https://expressjs.com/en/advanced/best-practice-performance.html

---

**Questions?** Check the troubleshooting section or the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide.
