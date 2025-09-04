-- Create public bucket for task images (if not exists) and add RLS policies

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'task-images'
  ) THEN
    PERFORM storage.create_bucket('task-images', public => true);
  END IF;
END $$;

-- Allow public read access to objects in the task-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read task-images'
  ) THEN
    CREATE POLICY "Public read task-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'task-images');
  END IF;
END $$;

-- Allow admins to insert into task-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins insert task-images'
  ) THEN
    CREATE POLICY "Admins insert task-images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'task-images'
      AND auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
    );
  END IF;
END $$;

-- Allow admins to update objects in task-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins update task-images'
  ) THEN
    CREATE POLICY "Admins update task-images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'task-images'
      AND auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
    )
    WITH CHECK (bucket_id = 'task-images');
  END IF;
END $$;

-- Allow admins to delete objects in task-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins delete task-images'
  ) THEN
    CREATE POLICY "Admins delete task-images"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'task-images'
      AND auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
    );
  END IF;
END $$;


