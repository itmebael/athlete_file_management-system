-- Add id_picture_url column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS id_picture_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.users.id_picture_url IS 'URL to the uploaded SSU ID picture';










