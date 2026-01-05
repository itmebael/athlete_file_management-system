-- Update user role to 'student' for testing
-- Run this in Supabase SQL Editor

-- First, let's see the current user data
SELECT id, email, role, full_name, created_at 
FROM public.users 
WHERE email = 'admin@ssu.edu.ph';

-- Update the role to 'student'
UPDATE public.users 
SET role = 'student' 
WHERE email = 'admin@ssu.edu.ph';

-- Verify the update
SELECT id, email, role, full_name, created_at 
FROM public.users 
WHERE email = 'admin@ssu.edu.ph';

-- Alternative: If you want to create a new student user instead
-- INSERT INTO public.users (id, email, role, full_name, created_at)
-- VALUES (
--   gen_random_uuid(),
--   'student@test.com',
--   'student',
--   'Test Student',
--   now()
-- );
