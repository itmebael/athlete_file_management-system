-- Delete student user Abel Redoblado
-- Run this in Supabase SQL Editor

-- First, let's see the current user data
SELECT id, email, role, full_name, created_at 
FROM public.users 
WHERE email = 'abel.redoblado@ssu.edu.ph';

-- Delete the user from public.users table
DELETE FROM public.users 
WHERE email = 'abel.redoblado@ssu.edu.ph';

-- Verify the deletion
SELECT COUNT(*) as remaining_users FROM public.users;
SELECT id, email, role, full_name FROM public.users;

-- Note: This will also delete the user from auth.users if there's a foreign key constraint
-- If you want to keep the auth user but remove from public.users, you may need to handle that separately

