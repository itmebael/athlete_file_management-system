-- EMERGENCY FIX: Completely reset users RLS policies
-- Run this in Supabase SQL Editor to fix the infinite recursion

-- Step 1: Drop ALL policies on users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;
DROP POLICY IF EXISTS "Allow admin access to all users" ON public.users;

-- Step 2: Temporarily disable RLS to allow access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Test that we can now access users
SELECT COUNT(*) as total_users FROM public.users;
SELECT id, email, role, full_name FROM public.users LIMIT 5;

-- Step 4: Re-enable RLS with a simple policy
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create a simple policy that allows all authenticated users to see all users
-- This is temporary - we'll make it more secure later
CREATE POLICY "Allow all authenticated users to see all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update all users" ON public.users
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow user profile creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- Step 6: Verify the fix
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Step 7: Test access again
SELECT COUNT(*) as total_users FROM public.users;
SELECT id, email, role, full_name FROM public.users;
