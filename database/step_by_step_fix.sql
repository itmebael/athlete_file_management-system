-- Step-by-step fix for folder display issue
-- Run each section one by one in Supabase SQL Editor

-- STEP 1: Check what we have
SELECT '=== STEP 1: Current Status ===' as info;

SELECT 'Folders count:' as info, COUNT(*) as count FROM public.folders;
SELECT 'Users count:' as info, COUNT(*) as count FROM public.users;

-- STEP 2: Show existing data
SELECT '=== STEP 2: Existing Data ===' as info;

SELECT 'Existing folders:' as info;
SELECT id, name, description, created_by, is_public, created_at 
FROM public.folders 
ORDER BY created_at DESC;

SELECT 'Existing users:' as info;
SELECT id, email, role, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- STEP 3: Fix RLS policies
SELECT '=== STEP 3: Fixing RLS Policies ===' as info;

-- Drop all existing policies
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

-- Create simple policy
CREATE POLICY "Allow all folder operations" ON public.folders
  FOR ALL USING (true) WITH CHECK (true);

SELECT 'RLS policies fixed!' as info;

-- STEP 4: Test folder reading
SELECT '=== STEP 4: Testing Folder Read ===' as info;

SELECT 'Testing folder read (should show all folders):' as info;
SELECT id, name, description, created_by, is_public, created_at 
FROM public.folders 
ORDER BY created_at DESC;

-- STEP 5: Create admin user (REPLACE EMAIL)
SELECT '=== STEP 5: Creating Admin User ===' as info;

-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO public.users (id, email, role, full_name)
VALUES (gen_random_uuid(), 'your-email@example.com', 'admin', 'Admin User')
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  full_name = 'Admin User';

SELECT 'Admin user created/updated!' as info;

-- STEP 6: Final verification
SELECT '=== STEP 6: Final Verification ===' as info;

SELECT 'All folders with user info:' as info;
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

SELECT 'All users:' as info;
SELECT id, email, role, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC;

SELECT '=== FIX COMPLETE ===' as info;

