# Troubleshooting Guide - Admin Dashboard Data Fetching Issues

## Quick Fix Steps

### 1. Check Environment Variables
Create a `.env.local` file in your project root with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

**Get these values from:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy "Project URL" and "Project API Key (anon public)"

### 2. Set Up Database
Run the SQL from `database/simple_schema.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the entire content of `database/simple_schema.sql`
3. Click "Run" to execute the SQL

### 3. Create Admin User
After running the schema, create an admin user:

```sql
-- Update your user to admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 4. Test Connection
1. Open the admin dashboard
2. Go to "Test Connection" tab
3. Click "Run Connection Tests"
4. Check the results for any errors

## Common Issues & Solutions

### Issue 1: "Failed to fetch data" Error
**Cause:** Environment variables not set or incorrect
**Solution:** 
- Check `.env.local` file exists
- Verify Supabase URL and key are correct
- Restart your development server after adding env vars

### Issue 2: "Users table error" or "Folders table error"
**Cause:** Tables don't exist or RLS policies blocking access
**Solution:**
- Run the `database/simple_schema.sql` in Supabase
- Check if tables exist in Supabase Dashboard > Table Editor
- Temporarily disable RLS if needed

### Issue 3: "No user authenticated" Error
**Cause:** User not logged in or session expired
**Solution:**
- Sign out and sign back in
- Check if user exists in the users table
- Verify user has admin role

### Issue 4: RLS Policy Errors
**Cause:** Row Level Security policies blocking data access
**Solution:**
- Check Supabase Dashboard > Authentication > Policies
- Ensure policies allow admin users to access data
- Or temporarily disable RLS for testing

## Debug Steps

### Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages when loading admin dashboard
4. Check Network tab for failed requests

### Step 2: Verify Database Setup
1. Go to Supabase Dashboard > Table Editor
2. Check if these tables exist:
   - `users`
   - `folders`
   - `files`
   - `announcements`
3. Check if they have data

### Step 3: Test Supabase Connection
1. Go to Supabase Dashboard > SQL Editor
2. Run this query:
```sql
SELECT * FROM public.users LIMIT 5;
```
3. If this works, the database is set up correctly

### Step 4: Check User Role
1. In Supabase Dashboard > Table Editor > users
2. Find your user record
3. Verify `role` column shows 'admin'

## Manual Database Setup

If the automated setup doesn't work, manually create tables:

```sql
-- 1. Create users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create folders table
CREATE TABLE public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create files table
CREATE TABLE public.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  folder_id UUID REFERENCES public.folders(id),
  uploaded_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create announcements table
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert sample data
INSERT INTO public.users (id, email, role, full_name) 
VALUES (gen_random_uuid(), 'admin@test.com', 'admin', 'Admin User');

-- 6. Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('athlete-files', 'athlete-files', true)
ON CONFLICT (id) DO NOTHING;
```

## Still Having Issues?

1. **Check the Test Connection tab** in the admin dashboard for detailed error messages
2. **Verify your Supabase project is active** (not paused)
3. **Check your internet connection** and Supabase service status
4. **Try creating a new Supabase project** if the current one has issues
5. **Check Supabase logs** in the Dashboard > Logs section

## Contact Support

If you're still having issues:
1. Copy the error messages from the Test Connection tab
2. Check browser console for additional errors
3. Verify your Supabase project settings
4. Make sure you're using the correct Supabase URL and API key

