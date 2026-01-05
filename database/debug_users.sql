-- Debug users table and role filtering
-- Run this in Supabase SQL Editor

-- 1. Check if users table exists and has data
SELECT 'Users table check:' as info;
SELECT COUNT(*) as total_users FROM public.users;

-- 2. Check users with different roles
SELECT 'Users by role:' as info;
SELECT role, COUNT(*) as count 
FROM public.users 
GROUP BY role;

-- 3. Check if there are any users with 'student' role
SELECT 'Students check:' as info;
SELECT COUNT(*) as student_count 
FROM public.users 
WHERE role = 'student';

-- 4. Show all users (first 10)
SELECT 'Sample users:' as info;
SELECT id, email, role, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check if there are any syntax issues with the table structure
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Test the exact query that might be failing
SELECT 'Test student query:' as info;
SELECT id, email, role, full_name, profile_picture_url
FROM public.users 
WHERE role = 'student'
ORDER BY created_at DESC;
