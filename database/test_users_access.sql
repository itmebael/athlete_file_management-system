-- Test users table access and RLS policies
-- Run this in Supabase SQL Editor to debug users table issues

-- Check if RLS is enabled on users table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check current user and role
SELECT auth.uid() as current_user_id, auth.email() as current_email, auth.role() as current_role;

-- Check if current user exists in users table
SELECT id, email, role, full_name, profile_picture_url 
FROM public.users 
WHERE id = auth.uid();

-- Test basic select on users table (this should work for admins)
SELECT id, email, role, full_name, profile_picture_url 
FROM public.users 
LIMIT 5;

-- Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test if we can see all users (admin should see all)
SELECT COUNT(*) as total_users FROM public.users;

-- Test if we can see student users specifically
SELECT COUNT(*) as student_users 
FROM public.users 
WHERE role = 'student';
