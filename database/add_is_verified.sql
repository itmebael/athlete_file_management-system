-- Add is_verified column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Backfill null values
UPDATE public.users
SET is_verified = COALESCE(is_verified, false)
WHERE is_verified IS NULL;

COMMENT ON COLUMN public.users.is_verified IS 'Indicates whether the athlete has been verified by admin';










