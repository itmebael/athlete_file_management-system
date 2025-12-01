# Netlify Deployment Guide

This guide will help you deploy the Athlete File Management System to Netlify.

## Prerequisites

- A Netlify account (sign up at [netlify.com](https://netlify.com))
- A Supabase project with the database schema set up
- Your Supabase project URL and anon key

## Step 1: Set Up Environment Variables

**CRITICAL:** You must set environment variables in Netlify before deploying, otherwise the build will fail.

1. Go to your Netlify Dashboard
2. Navigate to: **Site settings** → **Build & deploy** → **Environment**
3. Click **Add variable** and add the following:

   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
     **Value:** Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     **Value:** Your Supabase anon/public key

4. Click **Save** after adding each variable

### How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

### Option B: Deploy via Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket

2. In Netlify Dashboard:
   - Click **Add new site** → **Import an existing project**
   - Connect your Git provider and select your repository
   - Netlify will auto-detect Next.js settings

3. **Important:** Before clicking "Deploy site", verify:
   - Build command: `npm run build`
   - **Publish directory:** Leave this field **EMPTY** (the `@netlify/plugin-nextjs` plugin will automatically manage it)
   - Environment variables are set (from Step 1)
   
   **Note:** The `netlify.toml` file in the repository is configured correctly. Do NOT manually set the publish directory in the Netlify UI or `netlify.toml` - let the plugin handle it automatically. The plugin will create `.netlify/output/public` during the build process.

4. Click **Deploy site**

## Step 3: Verify Deployment

1. After deployment completes, visit your site URL
2. Test the application:
   - Splash screen should appear
   - Sign in/registration should work
   - File uploads should function correctly

## Troubleshooting

### Build Fails with Exit Code 2 - Missing Supabase Environment Variables

**Error:** Build script returned non-zero exit code: 2  
**Symptoms:** 
- Warnings about missing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Build completes compilation but fails during static page generation
- Error message: "Build script returned non-zero exit code: 2"

**Solution:** This is the **most common deployment issue**. You MUST set environment variables before deploying:

1. **Go to Netlify Dashboard:**
   - Navigate to **Site settings** → **Build & deploy** → **Environment** → **Environment variables**

2. **Add Required Variables:**
   - Click **Add variable**
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - **Scopes:** Select **All scopes** (Production, Deploy previews, Branch deploys)
   - Click **Save**
   
   - Click **Add variable** again
   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon/public key
   - **Scopes:** Select **All scopes**
   - Click **Save**

3. **Verify Variable Names:**
   - Ensure the keys are EXACTLY: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Case-sensitive - must match exactly
   - Must have the `NEXT_PUBLIC_` prefix

4. **Redeploy:**
   - After adding variables, go to **Deployments**
   - Click **Trigger deploy** → **Deploy site**
   - Or push a new commit to trigger automatic deployment

**Important Notes:**
- Environment variables are NOT automatically available - you must set them in Netlify
- The code has been updated to handle missing env vars during build, but you still need to set them for the app to work
- Setting variables only in `.env.local` won't work - Netlify needs them in the dashboard

### Build Fails with "supabaseUrl is required"

**Solution:** Ensure you've set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify environment variables (Step 1). See the section above for detailed steps.

### Build Fails with "sharp" Warning

**Solution:** The `sharp` package is already included in `package.json`. If you still see warnings, ensure Node.js version is 18.x or later. Add to `package.json`:
```json
"engines": {
  "node": "18.x"
}
```

### Build Fails with "publish directory cannot be the same as the base directory"

**Solution:** This error occurs when the publish directory is set to the repository root. Fix it by:

1. **Via Netlify UI:**
   - Go to **Site settings** → **Build & deploy** → **Continuous Deployment** → **Build settings** → **Edit settings**
   - **Remove or clear** the **Publish directory** field (leave it empty)
   - Click **Save**

2. **Via netlify.toml:**
   - The `netlify.toml` file should NOT have a `publish` setting
   - Let the `@netlify/plugin-nextjs` plugin manage the publish directory automatically
   - The plugin will create `.netlify/output/public` during the build

3. **Redeploy** your site after making the change

### Build Fails with "Your publish directory was not found at: .netlify/output/public"

**Error:** The Netlify Next.js plugin cannot find the expected output directory.

**Solution:** This happens when the publish directory is manually set but the plugin hasn't created it yet. Fix it by:

1. **Remove manual publish setting:**
   - In `netlify.toml`, ensure there is NO `publish` line under `[build]`
   - The plugin will automatically create and manage `.netlify/output/public`
   - Example correct `netlify.toml`:
     ```toml
     [build]
     command = "npm run build"
     # No publish line - plugin manages it
     
     [[plugins]]
     package = "@netlify/plugin-nextjs"
     ```

2. **Via Netlify UI:**
   - Go to **Site settings** → **Build & deploy** → **Continuous Deployment** → **Build settings** → **Edit settings**
   - **Clear/remove** the **Publish directory** field (leave it empty)
   - Click **Save**

3. **Redeploy** your site

**Why this works:** The `@netlify/plugin-nextjs` plugin needs to run after `next build` to convert the Next.js output into Netlify's format. If you manually set the publish directory, the plugin can't create it during its build process. By removing the manual setting, the plugin can manage the entire build lifecycle.

### App Works but Can't Connect to Supabase

**Solution:** 
1. Verify environment variables are set correctly in Netlify
2. Check that your Supabase project is active
3. Verify Row Level Security (RLS) policies are set up correctly
4. Check browser console for specific error messages

### Build Succeeds but App Shows Errors

**Solution:**
1. Check Netlify function logs: **Site settings** → **Functions** → **View logs**
2. Verify environment variables are available at runtime (they should be if set correctly)
3. Check Supabase dashboard for any API errors

## Environment Variables Reference

| Variable Name | Description | Required |
|--------------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose these variables to the client-side code.

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Supabase Documentation](https://supabase.com/docs)

