-- Create admin user manually
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address

-- 1. Check current users
SELECT 'Current users in database:' as info;
SELECT id, email, role, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- 2. Create admin user with your email
-- REPLACE 'your-email@example.com' with your actual email address
INSERT INTO public.users (id, email, role, full_name)
VALUES (gen_random_uuid(), 'your-email@example.com', 'admin', 'Admin User')
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  full_name = 'Admin User';

-- 3. Verify the user was created/updated
SELECT 'Updated users:' as info;
SELECT id, email, role, full_name, created_at 
FROM public.users 
WHERE email = 'your-email@example.com';

-- 4. Alternative: Update existing user to admin
-- If you already have a user record, update it to admin
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';
