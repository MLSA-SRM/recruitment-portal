-- Create storage buckets for file uploads

-- Create submissions bucket for video and document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/avi',
    'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for submissions bucket
CREATE POLICY "Users can upload their own submission files"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own submission files"
ON storage.objects FOR SELECT USING (
  bucket_id = 'submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all submission files"
ON storage.objects FOR SELECT USING (
  bucket_id = 'submissions' 
  AND auth.jwt() ->> 'email' IN ('hello@mlsasrm.in')
);

CREATE POLICY "Users can update their own submission files"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own submission files"
ON storage.objects FOR DELETE USING (
  bucket_id = 'submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
