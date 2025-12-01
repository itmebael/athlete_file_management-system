# Folder Display Fix Guide

## The Error You Encountered
```
ERROR: 42P01: missing FROM-clause entry for table "auth"
```

This happens because we tried to reference `auth.users` table directly, which isn't allowed in Supabase SQL Editor.

## Step-by-Step Fix

### Step 1: Fix RLS Policies
1. Go to **Supabase Dashboard** > **SQL Editor**
2. Copy and paste the entire content of `database/simple_fix.sql`
3. Click **"Run"** to execute
4. This will fix the RLS policies and show you all existing folders

### Step 2: Create/Update Your Admin User
1. In **Supabase Dashboard** > **SQL Editor**
2. Copy and paste the content of `database/create_admin_user.sql`
3. **IMPORTANT**: Replace `'your-email@example.com'` with your actual email address
4. Click **"Run"** to execute

### Step 3: Alternative Manual User Creation
If the auth functions don't work, manually create your user:

```sql
-- Replace with your actual email
INSERT INTO public.users (id, email, role, full_name)
VALUES (gen_random_uuid(), 'your-actual-email@example.com', 'admin', 'Admin User')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
```

### Step 4: Test the Fix
1. Go to your **Admin Dashboard**
2. Click on the **"Folders"** tab
3. Click the **"Refresh"** button
4. Check the **Debug Info** panel
5. Look at browser console for any errors

## What Each Script Does

### `simple_fix.sql`:
- ✅ Shows current folder count
- ✅ Displays all existing folders
- ✅ Removes all problematic RLS policies
- ✅ Creates a simple "allow all" policy
- ✅ Tests folder reading
- ✅ Shows user information

### `create_admin_user.sql`:
- ✅ Gets your current auth user ID
- ✅ Creates/updates your user record with admin role
- ✅ Verifies the user was created correctly

## Expected Results

After running both scripts, you should see:
- ✅ **All existing folders** displayed in the SQL results
- ✅ **Your user record** with admin role
- ✅ **Admin dashboard** showing all folders
- ✅ **No RLS policy errors**

## If Still Not Working

1. **Check the SQL results** - do you see your folders listed?
2. **Check your user record** - does it show role = 'admin'?
3. **Check browser console** for any JavaScript errors
4. **Try the Test Connection tab** in the admin dashboard

## Quick Test Query

Run this in SQL Editor to verify everything is working:

```sql
-- This should return all your folders
SELECT 
  f.id,
  f.name,
  f.description,
  f.created_at,
  u.email as created_by_email,
  u.role as created_by_role
FROM public.folders f
LEFT JOIN public.users u ON f.created_by = u.id
ORDER BY f.created_at DESC;
```

If this query returns your folders, then the database is working correctly and the issue is in the frontend.

