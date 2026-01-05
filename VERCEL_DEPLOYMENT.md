# Vercel Deployment Guide

This guide will help you deploy the Athlete File Management System to Vercel, the recommended platform for Next.js applications.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- A Supabase project with the database schema set up
- Your Supabase project URL and anon key
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Set Up Environment Variables

**CRITICAL:** You must set environment variables in Vercel before deploying, otherwise the build will fail.

### Via Vercel Dashboard

1. Go to your Vercel Dashboard
2. Navigate to your project (or create a new one)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
     **Value:** Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
     **Environment:** Production, Preview, Development (select all)

   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     **Value:** Your Supabase anon/public key
     **Environment:** Production, Preview, Development (select all)

5. Click **Save** after adding each variable

### Via Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [vercel.com/new](https://vercel.com/new)

3. Import your Git repository:
   - Click **Import Project**
   - Select your Git provider and repository
   - Vercel will auto-detect Next.js settings

4. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Add Environment Variables:**
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Step 1)
   - Or add them later in project settings

6. Click **Deploy**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```
   - Follow the prompts to link your project
   - For production deployment:
     ```bash
     vercel --prod
     ```

## Step 3: Verify Deployment

1. After deployment completes, visit your site URL (provided by Vercel)
2. Test the application:
   - Splash screen should appear
   - Sign in/registration should work
   - File uploads should function correctly

## Step 4: Configure Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

## Troubleshooting

### Build Fails with "supabaseUrl is required"

**Solution:** Ensure you've set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables (Step 1). Make sure they're set for the correct environment (Production, Preview, Development).

### Build Fails with "sharp" Warning

**Solution:** The `sharp` package is already included in `package.json`. Vercel automatically handles image optimization. If you still see warnings, ensure Node.js version is 18.x or later.

### Function Invocation Errors

**Common Vercel Error Codes:**

- **FUNCTION_INVOCATION_FAILED (500):** Server-side function error
  - Check function logs in Vercel Dashboard
  - Verify environment variables are set correctly
  - Check Supabase connection and RLS policies

- **FUNCTION_INVOCATION_TIMEOUT (504):** Function exceeded time limit
  - Optimize database queries
  - Check for infinite loops
  - Consider increasing function timeout in `vercel.json`

- **FUNCTION_PAYLOAD_TOO_LARGE (413):** Request body too large
  - Reduce file upload size
  - Implement chunked uploads for large files

- **FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE (500):** Response too large
  - Paginate large data responses
  - Optimize data fetching

### 404: NOT_FOUND Error

**Error Code:** `NOT_FOUND`  
**HTTP Status:** 404

This error occurs when Vercel cannot find the requested route or page.

**Common Causes & Solutions:**

1. **Route doesn't exist:**
   - Verify you're accessing the correct URL (e.g., `https://your-app.vercel.app/`)
   - Check that the route exists in your `app` directory
   - Ensure the page file is properly exported

2. **Build didn't include the route:**
   - Check build logs in Vercel Dashboard → Deployments → Select deployment
   - Verify the build completed successfully
   - Look for any errors during the build process

3. **Missing not-found.tsx:**
   - A `not-found.tsx` file has been added to handle 404 errors gracefully
   - Ensure it's in the `app` directory

4. **Incorrect base path or rewrites:**
   - Check `next.config.js` for any basePath or rewrites that might affect routing
   - Verify no custom routing configuration is interfering

5. **Deployment issues:**
   - Verify the deployment exists in Vercel Dashboard
   - Check if the deployment was deleted or paused
   - Try redeploying: **Deployments** → **Redeploy**

**Quick Fix Steps:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Check the latest deployment logs for errors
3. Verify environment variables are set correctly
4. Try accessing the root URL: `https://your-app.vercel.app/`
5. If root works but other routes don't, check your routing structure
6. Redeploy if needed: Click **Redeploy** on the latest deployment

### Deployment Not Found (404)

**Solution:**
- Verify the deployment exists in Vercel Dashboard
- Check if the deployment was deleted or paused
- Ensure you're accessing the correct URL

### DNS Errors

**Common DNS Error Codes:**

- **DNS_HOSTNAME_NOT_FOUND (502):** Domain not configured correctly
  - Verify DNS settings in your domain provider
  - Check Vercel domain configuration

- **DNS_HOSTNAME_RESOLVE_FAILED (502):** DNS resolution failed
  - Wait for DNS propagation (can take up to 48 hours)
  - Verify DNS records are correct

### Image Optimization Errors

- **INVALID_IMAGE_OPTIMIZE_REQUEST (400):** Invalid image request
  - Check image URLs are valid
  - Verify image domains in `next.config.js`

- **OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED (502):** External image failed
  - Add external image domain to `next.config.js`:
    ```js
    images: {
      domains: ['your-image-domain.com'],
    }
    ```

### Middleware Errors

- **MIDDLEWARE_INVOCATION_FAILED (500):** Middleware error
  - Check middleware code for errors
  - Verify middleware is in the correct location (`middleware.ts` in root)

### App Works but Can't Connect to Supabase

**Solution:**
1. Verify environment variables are set correctly in Vercel
2. Check that your Supabase project is active
3. Verify Row Level Security (RLS) policies are set up correctly
4. Check browser console for specific error messages
5. Verify environment variables are available at runtime (check Vercel function logs)

### Build Succeeds but App Shows Errors

**Solution:**
1. Check Vercel function logs: **Deployments** → Select deployment → **Functions** tab
2. Verify environment variables are available at runtime
3. Check Supabase dashboard for any API errors
4. Review browser console for client-side errors

## Environment Variables Reference

| Variable Name | Description | Required | Environment |
|--------------|-------------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes | All |

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose these variables to the client-side code. Set them for Production, Preview, and Development environments.

## Vercel Configuration File (Optional)

Create a `vercel.json` file in your project root for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Error Codes](https://vercel.com/docs/errors)
- [Supabase Documentation](https://supabase.com/docs)

## Common Vercel Error Codes Quick Reference

| Error Code | HTTP Status | Category | Common Cause |
|-----------|-------------|----------|--------------|
| `FUNCTION_INVOCATION_FAILED` | 500 | Function | Server error in function |
| `FUNCTION_INVOCATION_TIMEOUT` | 504 | Function | Function exceeded time limit |
| `FUNCTION_PAYLOAD_TOO_LARGE` | 413 | Function | Request body too large |
| `NOT_FOUND` | 404 | Deployment | Route/page not found |
| `DEPLOYMENT_NOT_FOUND` | 404 | Deployment | Deployment doesn't exist |
| `DNS_HOSTNAME_NOT_FOUND` | 502 | DNS | Domain not configured |
| `INVALID_IMAGE_OPTIMIZE_REQUEST` | 400 | Image | Invalid image URL/format |

For a complete list of error codes, see [Vercel Error Codes Documentation](https://vercel.com/docs/errors).

