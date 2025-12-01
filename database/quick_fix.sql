-- QUICK FIX - Run this now in Supabase SQL Editor
-- This will fix the folder display issue immediately

-- 1. Fix RLS policies (allows all folder operations)
DROP POLICY IF EXISTS "Allow all folder operations" ON public.folders;
CREATE POLICY "Allow all folder operations" ON public.folders
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Show all folders (this should work now)
SELECT 'All folders:' as info;
SELECT id, name, description, created_by, is_public, created_at 
FROM public.folders 
ORDER BY created_at DESC;

-- 3. Show all users
SELECT 'All users:' as info;
SELECT id, email, role, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- 4. If you need to create an admin user, uncomment and modify this line:
-- INSERT INTO public.users (id, email, role, full_name)
-- VALUES (gen_random_uuid(), 'your-actual-email@example.com', 'admin', 'Admin User')
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';
