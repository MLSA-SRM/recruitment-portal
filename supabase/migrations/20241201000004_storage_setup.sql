-- Migration: Storage setup for task images
-- Description: Creates storage bucket and policies for task images
-- Created: 2024-12-01

-- Create storage bucket for task images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-images',
  'task-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for task images
CREATE POLICY "Public can view task images" ON storage.objects
FOR SELECT USING (bucket_id = 'task-images');

CREATE POLICY "Admins can upload task images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task-images' AND 
  auth.role() = 'authenticated' AND
  (SELECT is_admin_simple())
);

CREATE POLICY "Admins can update task images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'task-images' AND 
  auth.role() = 'authenticated' AND
  (SELECT is_admin_simple())
);

CREATE POLICY "Admins can delete task images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'task-images' AND 
  auth.role() = 'authenticated' AND
  (SELECT is_admin_simple())
);
