-- Check user roles and fix admin access
-- Run this in Supabase SQL Editor

-- First, let's see what users we have and their roles
SELECT 
  id, 
  email, 
  role, 
  full_name,
  created_at
FROM public.users 
ORDER BY created_at DESC;

-- Check if there are any files in the database
SELECT COUNT(*) as total_files FROM public.files;

-- Check if there are any folders
SELECT COUNT(*) as total_folders FROM public.folders;

-- Check if there are any student folders
SELECT COUNT(*) as total_student_folders FROM public.student_folders;

-- If you need to update a user's role to admin, use this (replace with actual user email):
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-admin-email@example.com';

-- Check RLS policies on files table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'files';

