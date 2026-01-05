-- Fix RLS policies for users table to allow admins to see all users
-- Run this in Supabase SQL Editor

-- First, let's see the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create new policies that allow:
-- 1. Admins to see all users
-- 2. Users to see their own profile
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Also update the update policy to allow admins to update any user
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test the policies by checking what the current user can see
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM public.users WHERE id = auth.uid()) as current_user_role,
  COUNT(*) as total_users_visible
FROM public.users;
