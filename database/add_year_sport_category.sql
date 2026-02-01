-- Add year and sport_category columns to folders table for year-based organization
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS sport_category TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_year ON public.folders(year);
CREATE INDEX IF NOT EXISTS idx_folders_sport_category ON public.folders(sport_category);

-- Update existing folders to have current year if year is null
UPDATE public.folders 
SET year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE year IS NULL;

-- Function to automatically create folders for next year
CREATE OR REPLACE FUNCTION public.create_next_year_folders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year INTEGER;
  next_year INTEGER;
  sport_category_record TEXT;
  existing_sports TEXT[];
  admin_user_id UUID;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  next_year := current_year + 1;
  
  -- Check if folders for next year already exist
  IF EXISTS (SELECT 1 FROM public.folders WHERE year = next_year LIMIT 1) THEN
    RETURN;
  END IF;
  
  -- Get an admin user to create folders
  SELECT id INTO admin_user_id 
  FROM public.users 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found to create folders';
  END IF;
  
  -- Get all unique sport categories from existing folders
  SELECT ARRAY_AGG(DISTINCT sport_category) INTO existing_sports
  FROM public.folders
  WHERE sport_category IS NOT NULL;
  
  -- If no existing sports, use default sports list
  IF existing_sports IS NULL OR array_length(existing_sports, 1) IS NULL THEN
    existing_sports := ARRAY['Basketball', 'Volleyball', 'Football', 'Track and Field', 'Swimming', 'Tennis', 'Badminton', 'Chess'];
  END IF;
  
  -- Create folders for each sport category for the next year
  FOREACH sport_category_record IN ARRAY existing_sports
  LOOP
    INSERT INTO public.folders (name, description, created_by, is_public, year, sport_category)
    VALUES (
      sport_category_record || ' ' || next_year::TEXT,
      'Athlete documents for ' || sport_category_record || ' in ' || next_year::TEXT,
      admin_user_id,
      true,
      next_year,
      sport_category_record
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Create a scheduled function that runs at the end of each year
-- Note: This requires pg_cron extension. For manual trigger, use:
-- SELECT public.create_next_year_folders();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_next_year_folders() TO authenticated;





