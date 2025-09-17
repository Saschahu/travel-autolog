-- Create storage bucket for report images
-- This creates the 'reports' bucket with proper RLS policies

-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false, -- Not public - requires signed URLs
  8388608, -- 8MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Insert policy: users can upload their own report images
CREATE POLICY "users can upload own report images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Select policy: users can read their own report images via signed URLs
CREATE POLICY "users can read their own report images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);