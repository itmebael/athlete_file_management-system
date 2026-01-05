-- URGENT FIX: Remove infinite recursion in users RLS policy
-- Run this in Supabase SQL Editor immediately

-- First, drop ALL existing policies on users table to stop the recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;

-- Create a simple, non-recursive policy that allows admins to see all users
-- We'll use a different approach that doesn't cause recursion
CREATE POLICY "Allow admin access to all users" ON public.users
  FOR ALL USING (
    -- Check if current user is admin by looking at auth.jwt() claims
    -- This avoids querying the users table itself
    (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
    OR 
    -- Allow users to see their own profile
    auth.uid() = id
  );

-- Alternative approach: Temporarily disable RLS for testing
-- Uncomment the line below if the above doesn't work
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test basic access
SELECT COUNT(*) as total_users FROM public.users;

