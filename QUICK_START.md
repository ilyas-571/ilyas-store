# ⚡ Quick Start (30 minutes to live deployment)

**No prior experience needed. Copy-paste commands and follow along.**

---

## Step 1️⃣: Install Required Software (5 min)

### Windows:
1. Download Git: https://git-scm.com/download/win → Install (next, next, finish)
2. Download Node.js 18+: https://nodejs.org → Install (next, next, finish)
3. Open PowerShell and run:
   ```powershell
   npm install -g pnpm
   ```

### macOS:
```bash
brew install git node
npm install -g pnpm
```

**Verify installation:**
```bash
git --version        # Should show: git version 2.x.x
node --version       # Should show: v18.x.x or higher
pnpm --version       # Should show: 9.x.x or higher
```

---

## Step 2️⃣: Create GitHub Repository (5 min)

### 2.1 Sign up for GitHub (if you don't have account)
- Go to https://github.com/signup
- Create free account

### 2.2 Create New Repository
1. Go to https://github.com/new
2. **Repository name**: `ilyas-store`
3. **Public** or **Private** (your choice)
4. **Uncheck** "Add a README file" (we have one)
5. Click **Create repository**

### 2.3 Push Your Code to GitHub

Open terminal in your project folder and run:

```bash
cd c:\Users\FAWAD ALI\Downloads\ilyas-store

git init
git add .
git commit -m "Initial commit"

# Copy the commands from GitHub page for your username
# They look like this (replace YOUR_USERNAME):
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ilyas-store.git
git push -u origin main
```

**✅ Check:** Go to https://github.com/YOUR_USERNAME/ilyas-store → Should see your code

---

## Step 3️⃣: Set Up Free Accounts (3 min)

### 3.1 Vercel Account (for Frontend)
1. Go to https://vercel.com
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Click **Authorize Vercel**
5. **Done!**

### 3.2 Railway Account (for Backend + Database)
1. Go to https://railway.app
2. Click **Sign up**
3. Click **GitHub**
4. Click **Authorize Railway**
5. **Done!**

---

## Step 4️⃣: Set Up Database on Railway (5 min)

1. Go to https://railway.app/dashboard
2. Click **New Project**
3. Select **Provision PostgreSQL**
4. Wait 1-2 minutes for database to spin up

### Get Database Connection String:
1. Click **PostgreSQL** service
2. Go to **Connect** tab
3. **Copy** the connection string (looks like: `postgresql://postgres:...@[host]:5432/...`)
4. **Save it** in a text file for later

### Run Database Migrations:
```bash
cd lib/db

# Run this command (paste your connection string):
DATABASE_URL="postgresql://paste-connection-string-here" npx drizzle-kit migrate

# Should show: "✓ Migrations applied successfully"
```

---

## Step 5️⃣: Deploy Backend on Railway (5 min)

1. Go to https://railway.app/dashboard
2. Click your project
3. Click **New Service**
4. Select **GitHub Repo**
5. Click **Authorize** (if prompted)
6. Select your `ilyas-store` repo
7. Click **Configure**
8. Set **Root Directory**: `artifacts/api-server`
9. Click **Deploy**

### While Deploying, Set Environment Variables:

1. Click the **Express API** service
2. Go to **Variables** tab
3. Click **New Variable** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste your PostgreSQL connection string from Step 4 |
| `SESSION_SECRET` | Run this in terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste result |
| `NODE_ENV` | `production` |

### Get Your Backend URL:
1. Click the Express service
2. Go to **Settings** tab
3. Find **Domains** section
4. **Copy the domain** (example: `ilyas-store-api-prod.up.railway.app`)
5. **Save it** — you'll need it for frontend

---

## Step 6️⃣: Deploy Frontend on Vercel (5 min)

1. Go to https://vercel.com/new
2. Click **Continue with GitHub**
3. Search for `ilyas-store` repo
4. Click **Import**

### Configure:
1. **Framework**: Should auto-select Next.js (leave it)
2. **Root Directory**: Click **Edit** → Set to `artifacts/storefront-next`
3. **Environment Variables**: Click **Add** for each:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://[your-railway-domain-from-step-5]/api` |
| `NEXT_PUBLIC_SITE_URL` | Leave blank for now (Vercel gives you domain after deploy) |

4. Click **Deploy**

### After Deployment Completes:

1. You'll get a domain like: `ilyas-store.vercel.app`
2. Go to **Settings** → **Environment Variables**
3. Update:
   - `NEXT_PUBLIC_SITE_URL` = `https://ilyas-store.vercel.app` (or your domain)
4. Click **Redeploy**

---

## Step 7️⃣: Test Your Live Site! 🎉

### Test Backend:
Open this URL in browser (replace with your Railway domain):
```
https://[your-railway-domain]/api/health
```
Should return: `{"status":"ok"}` (or similar JSON)

### Test Frontend:
Open this URL in browser:
```
https://ilyas-store.vercel.app
```
Should see: **Ilyas Store homepage** with products!

### Test Functionality:
- ✅ Click on a product
- ✅ Add to cart
- ✅ Scroll homepage
- ✅ Check if images load

---

## 🎯 Summary: Your Live URLs

| Service | URL |
|---------|-----|
| **Your Store** | `https://ilyas-store.vercel.app` (or your Vercel domain) |
| **API** | `https://[railway-domain].up.railway.app` |
| **GitHub** | `https://github.com/YOUR_USERNAME/ilyas-store` |

---

## 🔄 Update Your Site (Always Free!)

Every time you make changes:

```bash
git add .
git commit -m "Updated products page"
git push origin main
```

**Boom!** Vercel and Railway automatically rebuild and deploy. Check deployment status:
- **Vercel**: https://vercel.com/dashboard (click your project)
- **Railway**: https://railway.app/dashboard (click your project)

---

## ❌ Common Issues & Fixes

### "Products page shows nothing"
- Wait 5 minutes (Railway might still be deploying)
- Refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console (F12) for errors

### "API domain not responding"
- Check Railway dashboard → Express service is running
- Verify DATABASE_URL is set correctly in Railway
- Try redeploy: Go to Railway → Express service → Click **Deploy** → **Redeploy**

### "Build failed on Vercel"
- Click the failed deployment to see error
- Most common: Check `Root Directory` is `artifacts/storefront-next`
- Redeploy: Go to Vercel → Click **Redeploy**

### "Can't push to GitHub"
Make sure you configured git:
```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
git push origin main
```

---

## 📚 Next Steps

1. **Monitor your store**: Check logs if something breaks
   - Vercel: Dashboard → Deployments → Click a build
   - Railway: Dashboard → Express service → Click Logs

2. **Custom domain** (optional):
   - Buy domain from Namecheap ($0.88/year)
   - Add to Vercel: Settings → Domains
   - Follow DNS instructions

3. **Add features**:
   - Payment processing (Stripe)
   - Email notifications
   - Admin dashboard

---

## 💬 Need Help?

- **Stuck on Step X?** Go back and re-read that step carefully
- **Error messages?** Copy the error → Google it → Stack Overflow usually has answer
- **Full guides**: See [FREE_DEPLOYMENT.md](./FREE_DEPLOYMENT.md) for detailed instructions
- **Environment help**: See [ENV_SETUP.md](./ENV_SETUP.md)

---

## ✅ That's It! 🚀

You now have a **free, live eCommerce store** running on the internet!

**Total time: ~30 minutes**
**Total cost: $0**
**Traffic handled: Thousands of visitors/month (free tier)**

Share your site: `https://ilyas-store.vercel.app` 🎉
