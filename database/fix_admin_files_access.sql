-- Fix admin access to files
-- Run this in Supabase SQL Editor

-- 1. First, let's check what we have
SELECT 'Current users:' as info;
SELECT id, email, role, full_name FROM public.users ORDER BY created_at DESC;

SELECT 'Current files count:' as info;
SELECT COUNT(*) as total_files FROM public.files;

SELECT 'Current folders count:' as info;
SELECT COUNT(*) as total_folders FROM public.folders;

-- 2. Check if RLS is enabled on files table
SELECT 'RLS status on files table:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'files';

-- 3. Check current RLS policies on files
SELECT 'Current RLS policies on files:' as info;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'files';

-- 4. If you need to temporarily disable RLS for testing (NOT recommended for production)
-- ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;

-- 5. If you need to create a test file (replace with actual user ID)
-- INSERT INTO public.files (name, original_name, file_size, mime_type, uploaded_by, folder_id)
-- VALUES ('test-file.txt', 'test-file.txt', 1024, 'text/plain', 'your-user-id-here', null);

-- 6. If you need to update a user's role to admin (replace with actual email)
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-admin-email@example.com';

-- 7. Alternative: Create a more permissive admin policy
DROP POLICY IF EXISTS "Admins can view all files" ON public.files;
CREATE POLICY "Admins can view all files" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 8. Also ensure admins can see files in any folder
DROP POLICY IF EXISTS "Admins can view files in any folder" ON public.files;
CREATE POLICY "Admins can view files in any folder" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
