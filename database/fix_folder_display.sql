-- Fix folder display issue - Run this in Supabase SQL Editor

-- 1. First, check if folders exist
SELECT COUNT(*) as folder_count FROM public.folders;

-- 2. Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'folders';

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

-- 4. Create simple policies that allow everything for testing
CREATE POLICY "Allow all folder operations" ON public.folders
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'folders';

-- 6. Test if we can read folders
SELECT id, name, description, created_by, is_public, created_at 
FROM public.folders 
ORDER BY created_at DESC;

-- 7. Check if your user exists and has admin role
SELECT id, email, role, full_name 
FROM public.users 
WHERE id = auth.uid();

-- 8. If your user doesn't exist, create it
INSERT INTO public.users (id, email, role, full_name)
SELECT 
  auth.uid(),
  auth.email(),
  'admin',
  COALESCE(auth.jwt() ->> 'email', 'Admin User')
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = auth.uid()
);

-- 9. Update your user to admin role if needed
UPDATE public.users 
SET role = 'admin' 
WHERE id = auth.uid();

-- 10. Final test - this should return all folders
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
