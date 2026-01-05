-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  full_name TEXT NOT NULL,
  student_id TEXT,
  phone TEXT,
  course TEXT,
  year_level TEXT,
  sport TEXT,
  position TEXT,
  department TEXT,
  title TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to handle new user signup (SIMPLIFIED)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple insert with minimal validation
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and continue (don't fail the auth signup)
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Alternative function to manually create user profile (fallback)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'student',
  user_student_id TEXT DEFAULT '',
  user_phone TEXT DEFAULT '',
  user_course TEXT DEFAULT '',
  user_year_level TEXT DEFAULT '',
  user_sport TEXT DEFAULT '',
  user_position TEXT DEFAULT '',
  user_department TEXT DEFAULT '',
  user_title TEXT DEFAULT '',
  user_profile_picture_url TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate role
  IF user_role NOT IN ('admin', 'student') THEN
    user_role := 'student';
  END IF;
  
  -- Validate full name
  IF user_full_name = '' OR user_full_name IS NULL THEN
    user_full_name := 'User';
  END IF;
  
  -- Insert user profile
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role,
    student_id,
    phone,
    course,
    year_level,
    sport,
    position,
    department,
    title,
    profile_picture_url
  )
  VALUES (
    user_id,
    user_email,
    user_full_name,
    user_role,
    user_student_id,
    user_phone,
    user_course,
    user_year_level,
    user_sport,
    user_position,
    user_department,
    user_title,
    user_profile_picture_url
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_profile for user %: %', user_email, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  parent_folder_id UUID REFERENCES public.folders(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_folders table (personal folders for students)
CREATE TABLE IF NOT EXISTS public.student_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  student_id UUID REFERENCES public.users(id) NOT NULL,
  sport_folder_id UUID REFERENCES public.folders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sport_folder_id column if it doesn't exist (for existing tables)
ALTER TABLE public.student_folders 
ADD COLUMN IF NOT EXISTS sport_folder_id UUID REFERENCES public.folders(id);

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  folder_id UUID REFERENCES public.folders(id),
  student_folder_id UUID REFERENCES public.student_folders(id),
  uploaded_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow user profile creation (for signup and triggers)
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;
CREATE POLICY "Allow user profile creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- RLS Policies for folders table
-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view public folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can view all folders" ON public.folders;
DROP POLICY IF EXISTS "Students can view folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can create folders" ON public.folders;
DROP POLICY IF EXISTS "Students can create folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can update folders" ON public.folders;
DROP POLICY IF EXISTS "Students can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON public.folders;
DROP POLICY IF EXISTS "Students can delete their own folders" ON public.folders;

-- Create new policies
-- TEMPORARY: Allow anyone to view all folders for testing
CREATE POLICY "Anyone can view all folders for testing" ON public.folders
  FOR SELECT USING (true);

-- Anyone can view public folders
CREATE POLICY "Anyone can view public folders" ON public.folders
  FOR SELECT USING (is_public = true);

-- Admins can view all folders
CREATE POLICY "Admins can view all folders" ON public.folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can view folders they created
CREATE POLICY "Users can view their own folders" ON public.folders
  FOR SELECT USING (created_by = auth.uid());

-- Admins can create folders
CREATE POLICY "Admins can create folders" ON public.folders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Students can create folders
CREATE POLICY "Students can create folders" ON public.folders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'student'
    )
  );

-- Admins can update all folders
CREATE POLICY "Admins can update all folders" ON public.folders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can update their own folders
CREATE POLICY "Users can update their own folders" ON public.folders
  FOR UPDATE USING (created_by = auth.uid());

-- Admins can delete all folders
CREATE POLICY "Admins can delete all folders" ON public.folders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can delete their own folders
CREATE POLICY "Users can delete their own folders" ON public.folders
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for student_folders table
DROP POLICY IF EXISTS "Students can view their own folders" ON public.student_folders;
CREATE POLICY "Students can view their own folders" ON public.student_folders
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create their own folders" ON public.student_folders;
CREATE POLICY "Students can create their own folders" ON public.student_folders
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own folders" ON public.student_folders;
CREATE POLICY "Students can update their own folders" ON public.student_folders
  FOR UPDATE USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can delete their own folders" ON public.student_folders;
CREATE POLICY "Students can delete their own folders" ON public.student_folders
  FOR DELETE USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all student folders" ON public.student_folders;
CREATE POLICY "Admins can view all student folders" ON public.student_folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Enhanced RLS Policies for better student isolation
-- Drop existing policies and recreate with stricter controls

-- Drop existing file policies
DROP POLICY IF EXISTS "Users can view files in public folders" ON public.files;
DROP POLICY IF EXISTS "Users can view files they uploaded" ON public.files;
DROP POLICY IF EXISTS "Students can only view their own files" ON public.files;
DROP POLICY IF EXISTS "Admins can view all files" ON public.files;
DROP POLICY IF EXISTS "Users can upload files" ON public.files;
DROP POLICY IF EXISTS "Users can delete files they uploaded" ON public.files;
DROP POLICY IF EXISTS "Admins can delete any file" ON public.files;

-- Create stricter file policies
DROP POLICY IF EXISTS "Students can only view their own files" ON public.files;
CREATE POLICY "Students can only view their own files" ON public.files
  FOR SELECT USING (
    uploaded_by = auth.uid() AND 
    student_folder_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Students can view files in public folders" ON public.files;
CREATE POLICY "Students can view files in public folders" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'student'
    ) AND
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = files.folder_id AND folders.is_public = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all files" ON public.files;
CREATE POLICY "Admins can view all files" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can upload files" ON public.files;
CREATE POLICY "Users can upload files" ON public.files
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete files they uploaded" ON public.files;
CREATE POLICY "Users can delete files they uploaded" ON public.files
  FOR DELETE USING (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Admins can delete any file" ON public.files;
CREATE POLICY "Admins can delete any file" ON public.files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create storage bucket for files (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('athlete-files', 'athlete-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for profile pictures (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
CREATE POLICY "Anyone can view files" ON storage.objects
  FOR SELECT USING (bucket_id = 'athlete-files');

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-files' AND 
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'athlete-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins can delete any file" ON storage.objects;
CREATE POLICY "Admins can delete any file" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'athlete-files' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Storage policies for profile pictures
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policies for announcements table
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
CREATE POLICY "Anyone can view announcements" ON public.announcements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
CREATE POLICY "Admins can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements" ON public.announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements" ON public.announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Analytics helper functions
CREATE OR REPLACE FUNCTION public.get_folder_stats()
RETURNS TABLE (
  folder_id UUID,
  folder_name TEXT,
  sub_folder_count BIGINT,
  file_count BIGINT,
  total_size BIGINT,
  level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_hierarchy AS (
    -- Base case: root folders (no parent)
    SELECT 
      f.id,
      f.name,
      f.parent_folder_id,
      0 as level,
      ARRAY[f.id] as path
    FROM public.folders f
    WHERE f.parent_folder_id IS NULL
    
    UNION ALL
    
    -- Recursive case: sub-folders
    SELECT 
      f.id,
      f.name,
      f.parent_folder_id,
      fh.level + 1,
      fh.path || f.id
    FROM public.folders f
    JOIN folder_hierarchy fh ON f.parent_folder_id = fh.id
    WHERE NOT f.id = ANY(fh.path) -- Prevent infinite loops
  ),
  folder_stats AS (
    SELECT 
      fh.id as folder_id,
      fh.name as folder_name,
      fh.level,
      COALESCE(sub_folders.count, 0) as sub_folder_count,
      COALESCE(files.count, 0) as file_count,
      COALESCE(files.total_size, 0) as total_size
    FROM folder_hierarchy fh
    LEFT JOIN (
      SELECT 
        parent_folder_id,
        COUNT(*) as count
      FROM public.folders
      WHERE parent_folder_id IS NOT NULL
      GROUP BY parent_folder_id
    ) sub_folders ON fh.id = sub_folders.parent_folder_id
    LEFT JOIN (
      SELECT 
        folder_id,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM public.files
      WHERE folder_id IS NOT NULL
      GROUP BY folder_id
    ) files ON fh.id = files.folder_id
  )
  SELECT 
    folder_id,
    folder_name,
    sub_folder_count,
    file_count,
    total_size,
    level
  FROM folder_stats
  ORDER BY total_size DESC, sub_folder_count DESC;
END;
$$;

-- Function to get storage breakdown by file type
CREATE OR REPLACE FUNCTION public.get_storage_breakdown()
RETURNS TABLE (
  file_type TEXT,
  file_count BIGINT,
  total_size BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_storage BIGINT;
BEGIN
  -- Get total storage
  SELECT COALESCE(SUM(file_size), 0) INTO total_storage FROM public.files;
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.mime_type LIKE 'image/%' THEN 'Images'
      WHEN f.mime_type LIKE 'video/%' THEN 'Videos'
      WHEN f.mime_type LIKE 'audio/%' THEN 'Audio'
      WHEN f.mime_type = 'application/pdf' THEN 'PDFs'
      WHEN f.mime_type LIKE 'application/msword%' OR f.mime_type LIKE 'application/vnd.openxmlformats%' THEN 'Documents'
      WHEN f.mime_type LIKE 'text/%' THEN 'Text Files'
      ELSE 'Other'
    END as file_type,
    COUNT(*) as file_count,
    SUM(f.file_size) as total_size,
    CASE 
      WHEN total_storage > 0 THEN ROUND((SUM(f.file_size)::NUMERIC / total_storage::NUMERIC) * 100, 2)
      ELSE 0
    END as percentage
  FROM public.files f
  GROUP BY 
    CASE 
      WHEN f.mime_type LIKE 'image/%' THEN 'Images'
      WHEN f.mime_type LIKE 'video/%' THEN 'Videos'
      WHEN f.mime_type LIKE 'audio/%' THEN 'Audio'
      WHEN f.mime_type = 'application/pdf' THEN 'PDFs'
      WHEN f.mime_type LIKE 'application/msword%' OR f.mime_type LIKE 'application/vnd.openxmlformats%' THEN 'Documents'
      WHEN f.mime_type LIKE 'text/%' THEN 'Text Files'
      ELSE 'Other'
    END
  ORDER BY total_size DESC;
END;
$$;

-- Allow authenticated role to execute analytics helper functions
GRANT EXECUTE ON FUNCTION public.get_folder_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_storage_breakdown() TO authenticated;
