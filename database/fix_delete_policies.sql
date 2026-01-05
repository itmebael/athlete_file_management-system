-- Fix RLS policies to allow admins to delete users and related data
-- Run this in Supabase SQL Editor

-- 1. Allow admins to delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Allow admins to delete student folders
DROP POLICY IF EXISTS "Admins can delete student folders" ON public.student_folders;
CREATE POLICY "Admins can delete student folders" ON public.student_folders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Allow admins to delete files
DROP POLICY IF EXISTS "Admins can delete files" ON public.files;
CREATE POLICY "Admins can delete files" ON public.files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Allow admins to delete announcements
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements" ON public.announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
