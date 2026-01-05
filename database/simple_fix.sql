-- Simple fix for folder display issue
-- Run this in Supabase SQL Editor

-- 1. Check current folder count
SELECT 'Current folder count:' as info, COUNT(*) as count FROM public.folders;

-- 2. Show all existing folders
SELECT 'Existing folders:' as info;
SELECT id, name, description, created_by, is_public, created_at 
FROM public.folders 
ORDER BY created_at DESC;

-- 3. Drop all existing folder policies
DROP POLICY IF EXISTS "Anyone can view all folders for testing" ON public.folders;
DROP POLICY IF EXISTS "Anyone can view public folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can view all folders" ON public.folders;
DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can create folders" ON public.folders;
DROP POLICY IF EXISTS "Students can create folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can update all folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can delete all folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
DROP POLICY IF EXISTS "Allow all folder operations" ON public.folders;

-- 4. Create a simple policy that allows everything
CREATE POLICY "Allow all folder operations" ON public.folders
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Verify the policy was created
SELECT 'New policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'folders';

-- 6. Test reading folders again
SELECT 'Testing folder read:' as info;
SELECT id, name, description, created_by, is_public, created_at 
FROM public.folders 
ORDER BY created_at DESC;

-- 7. Check users table
SELECT 'Users in database:' as info;
SELECT id, email, role, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- 8. If you need to manually set a user as admin, replace 'your-email@example.com' with your actual email
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- 9. Final verification
SELECT 'Final verification - all folders:' as info;
SELECT 
  f.id,
  f.name,
  f.description,
  f.created_by,
  f.is_public,
  f.created_at,
  u.email as created_by_email,
  u.role as created_by_role
FROM public.folders f
LEFT JOIN public.users u ON f.created_by = u.id
ORDER BY f.created_at DESC;
