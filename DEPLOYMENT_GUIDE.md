# Deployment Guide - Athlete File Management System

This guide covers deploying your Next.js application to production. Choose either **Netlify** or **Vercel** (both are excellent for Next.js).

## Quick Start

### Option 1: Deploy to Vercel (Recommended for Next.js)

**Time:** ~5 minutes  
**Difficulty:** Easy

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to [vercel.com/new](https://vercel.com/new)**
   - Click **Import Project**
   - Select your Git provider and repository
   - Vercel auto-detects Next.js settings

3. **Set Environment Variables:**
   - In the deployment setup, click **Environment Variables**
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - Select **All environments** (Production, Preview, Development)
   - Click **Save**

4. **Click Deploy**
   - Vercel will build and deploy automatically
   - Your site will be live in ~2 minutes

5. **Access your site:**
   - Vercel provides a URL like: `https://your-app.vercel.app`
   - You can add a custom domain later

**Detailed Guide:** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

### Option 2: Deploy to Netlify

**Time:** ~5 minutes  
**Difficulty:** Easy

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to [app.netlify.com](https://app.netlify.com)**
   - Click **Add new site** → **Import an existing project**
   - Connect your Git provider and select your repository

3. **Configure Build Settings:**
   - **Build command:** `npm run build` (auto-detected)
   - **Publish directory:** Leave **EMPTY** (plugin manages it)
   - Click **Show advanced** and verify settings

4. **Set Environment Variables:**
   - Before deploying, go to **Site settings** → **Build & deploy** → **Environment**
   - Click **Add variable** and add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click **Save** for each variable

5. **Deploy:**
   - Click **Deploy site**
   - Wait for build to complete (~2-3 minutes)

6. **Access your site:**
   - Netlify provides a URL like: `https://your-app.netlify.app`
   - You can add a custom domain later

**Detailed Guide:** See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

---

## Prerequisites

Before deploying, ensure you have:

### 1. Supabase Project Set Up

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your credentials:
   - Go to **Settings** → **API**
   - Copy **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Run the SQL from `database/schema.sql` to create tables and policies

### 3. Git Repository

Your code should be in a Git repository (GitHub, GitLab, or Bitbucket):
```bash
# If not already in Git:
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

---

## Step-by-Step: Vercel Deployment

### Method 1: Via Vercel Dashboard (Easiest)

1. **Prepare your code:**
   ```bash
   # Make sure everything is committed
   git status
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. **Import to Vercel:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with GitHub/GitLab/Bitbucket
   - Click **Import Project**
   - Select your repository
   - Click **Import**

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

4. **Add Environment Variables:**
   - Click **Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL` with your Supabase URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your anon key
   - Select **All environments** for both
   - Click **Save**

5. **Deploy:**
   - Click **Deploy**
   - Wait 2-3 minutes for build to complete
   - Your site is live!

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# For production
vercel --prod
```

---

## Step-by-Step: Netlify Deployment

### Method 1: Via Netlify Dashboard (Easiest)

1. **Prepare your code:**
   ```bash
   # Make sure everything is committed
   git status
   git add .
   git commit -m "Ready for Netlify deployment"
   git push
   ```

2. **Import to Netlify:**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Sign in with GitHub/GitLab/Bitbucket
   - Click **Add new site** → **Import an existing project**
   - Select your repository
   - Click **Next**

3. **Configure Build Settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** Leave **EMPTY** (important!)
   - Click **Show advanced** to verify
   - Click **Deploy site**

4. **Set Environment Variables (IMPORTANT!):**
   - Go to **Site settings** → **Build & deploy** → **Environment**
   - Click **Add variable**
   - Add `NEXT_PUBLIC_SUPABASE_URL` with your Supabase URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your anon key
   - Click **Save** for each

5. **Redeploy:**
   - Go to **Deployments**
   - Click **Trigger deploy** → **Deploy site**
   - Wait for build to complete

### Method 2: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize (first time)
netlify init

# Deploy
netlify deploy --prod
```

---

## Environment Variables Reference

| Variable Name | Description | Where to Get It |
|--------------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase Dashboard → Settings → API → anon public key |

**Important:**
- Must have `NEXT_PUBLIC_` prefix for Next.js to expose to client
- Set for **all environments** (Production, Preview, Development)
- Never commit these to Git - use platform environment variables

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Site loads without errors
- [ ] Splash screen appears
- [ ] Sign in/registration works
- [ ] File uploads function
- [ ] Admin dashboard accessible
- [ ] Student dashboard accessible
- [ ] Environment variables are set correctly
- [ ] Custom domain configured (if applicable)

---

## Troubleshooting

### Build Fails

**Common causes:**
1. **Missing environment variables** - Most common issue
   - Solution: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in platform dashboard

2. **Build errors**
   - Check build logs in deployment dashboard
   - Fix any TypeScript or compilation errors
   - Ensure all dependencies are in `package.json`

3. **Publish directory errors (Netlify)**
   - Ensure publish directory is **empty** in Netlify UI
   - The `netlify.toml` should not have a `publish` setting

### App Deploys but Doesn't Work

1. **Check environment variables:**
   - Verify they're set in the platform dashboard
   - Ensure they're set for the correct environment
   - Check variable names match exactly (case-sensitive)

2. **Check Supabase:**
   - Verify project is active
   - Check database schema is set up
   - Verify RLS policies are configured

3. **Check browser console:**
   - Look for JavaScript errors
   - Check network tab for failed requests

### Need More Help?

- **Vercel:** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed troubleshooting
- **Netlify:** See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for detailed troubleshooting
- **General:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Quick Comparison: Vercel vs Netlify

| Feature | Vercel | Netlify |
|---------|--------|---------|
| **Next.js Support** | Excellent (made by Next.js creators) | Excellent |
| **Setup Time** | ~2 minutes | ~3 minutes |
| **Build Speed** | Very Fast | Fast |
| **Free Tier** | Generous | Generous |
| **Custom Domains** | Free SSL | Free SSL |
| **Ease of Use** | Very Easy | Very Easy |
| **Recommended For** | Next.js apps | General web apps |

**Recommendation:** Both are excellent. Vercel is slightly easier for Next.js, but Netlify works great too.

---

## Next Steps After Deployment

1. **Add Custom Domain:**
   - Vercel: Project Settings → Domains → Add domain
   - Netlify: Site settings → Domain management → Add custom domain

2. **Set Up Monitoring:**
   - Enable error tracking
   - Set up uptime monitoring
   - Configure analytics

3. **Optimize Performance:**
   - Enable image optimization
   - Configure CDN settings
   - Set up caching

4. **Security:**
   - Review environment variables
   - Enable 2FA on deployment accounts
   - Review Supabase RLS policies

---

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Netlify Docs:** [docs.netlify.com](https://docs.netlify.com)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

