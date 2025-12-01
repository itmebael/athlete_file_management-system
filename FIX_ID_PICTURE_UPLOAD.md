# Fix ID Picture Upload Error

## Problem
Getting "Failed to upload ID picture. Please try again." error during signup.

## Common Causes & Solutions

### 1. Storage Bucket Doesn't Exist

**Solution:** Create the storage bucket in Supabase

1. Go to Supabase Dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **"New bucket"**
4. Create a bucket named: `athlete-files`
5. Make it **Public** (toggle ON)
6. Click **"Create bucket"**

### 2. Storage Policies Not Set Up

**Solution:** Run this SQL in Supabase SQL Editor

```sql
-- Allow anyone to view files
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
CREATE POLICY "Anyone can view files" ON storage.objects
  FOR SELECT USING (bucket_id = 'athlete-files');

-- Allow authenticated users to upload files (even during signup)
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-files' AND 
    auth.role() = 'authenticated'
  );

-- Allow public uploads for signup (temporary solution)
DROP POLICY IF EXISTS "Public can upload ID pictures during signup" ON storage.objects;
CREATE POLICY "Public can upload ID pictures during signup" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-files' AND 
    (storage.foldername(name))[1] = 'id-pictures'
  );
```

### 3. User Not Authenticated During Signup

**Issue:** During signup, the user isn't authenticated yet, so they can't upload files.

**Solution:** Upload ID picture AFTER account creation, or allow public uploads for ID pictures.

### 4. File Size Too Large

**Check:** The code limits files to 5MB. Make sure your ID picture is smaller.

### 5. File Type Not Supported

**Check:** Only image files are accepted. Make sure you're uploading a valid image (JPG, PNG, etc.)

## Quick Fix: Allow Public ID Picture Uploads (RECOMMENDED)

Run this SQL in Supabase SQL Editor to allow ID picture uploads during signup:

```sql
-- Allow public uploads to id-pictures folder (for signup)
DROP POLICY IF EXISTS "Public can upload ID pictures" ON storage.objects;
CREATE POLICY "Public can upload ID pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-files' AND 
    (storage.foldername(name))[1] = 'id-pictures'
  );

-- Also allow viewing ID pictures
DROP POLICY IF EXISTS "Anyone can view ID pictures" ON storage.objects;
CREATE POLICY "Anyone can view ID pictures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'athlete-files' AND 
    (storage.foldername(name))[1] = 'id-pictures'
  );
```

**After running this SQL:**
1. The ID picture upload should work during signup
2. Users don't need to be authenticated to upload ID pictures
3. This is safe because ID pictures are in a separate folder

## Current Implementation

The code has been updated to:
1. Create account first
2. Try to upload ID picture if user is authenticated
3. If upload fails (user not authenticated yet), store a note to upload after email confirmation
4. Show helpful messages to the user

**The best solution is still to allow public uploads** (see Quick Fix above) so ID pictures can be uploaded immediately during signup.

## Check Current Error

To see the exact error:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try uploading ID picture again
4. Look for the error message
5. Share the error message for more specific help

## Verify Storage Setup

1. Go to Supabase Dashboard → Storage
2. Check if `athlete-files` bucket exists
3. Check bucket policies (click on bucket → Policies tab)
4. Make sure upload policies are set correctly

