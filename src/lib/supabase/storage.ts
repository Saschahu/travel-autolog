import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'reports';
const SIGNED_URL_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Upload image to Supabase storage
 * Path format: userId/yyyy/mm/dd/uuid.jpg
 */
export async function uploadReportImage(blob: Blob, originalName: string): Promise<string> {
  // Check if we're in development and bucket doesn't exist
  if (import.meta.env.DEV) {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.warn(`[DEV] Storage bucket '${BUCKET_NAME}' not found, returning stub URL`);
      return createStubImageUrl(originalName);
    }
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Generate file path
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const uuid = crypto.randomUUID();
  const extension = 'jpg'; // Always JPEG after processing
  
  const filePath = `${user.id}/${year}/${month}/${day}/${uuid}.${extension}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Generate signed URL
  const { data: signedUrl, error: signError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(data.path, SIGNED_URL_TTL);

  if (signError) {
    console.error('Signed URL error:', signError);
    throw new Error(`Failed to create signed URL: ${signError.message}`);
  }

  return signedUrl.signedUrl;
}

/**
 * Create stub URL for development when bucket doesn't exist
 */
function createStubImageUrl(originalName: string): string {
  if (import.meta.env.PROD) {
    throw new Error('Storage bucket not configured');
  }
  
  // Return a data URL placeholder for development
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DEV STUB IMAGE', 150, 90);
    ctx.fillText(originalName, 150, 110);
    ctx.fillText('(Bucket not configured)', 150, 130);
  }
  
  return canvas.toDataURL('image/png');
}