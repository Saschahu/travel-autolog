/**
 * Supabase image upload utilities for report images
 */

import { supabase } from '@/integrations/supabase/client';
import { resizeImage, validateImageFile, validateFileSignature } from './imageResize';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

/**
 * Upload image to Supabase storage with validation and resizing
 */
export async function uploadReportImage(file: File): Promise<UploadResult> {
  try {
    // Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Validate file signature for security
    const isValidSignature = await validateFileSignature(file);
    if (!isValidSignature) {
      return { 
        success: false, 
        error: 'Invalid file format. File signature does not match extension.' 
      };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Resize image and strip EXIF
    const resized = await resizeImage(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.85,
      format: 'jpeg'
    });

    // Generate unique filename
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const fileName = `${user.id}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}/${uuid}.jpg`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(fileName, resized.blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Upload failed: ' + error.message };
    }

    // Get signed URL for the uploaded image
    const { data: signedUrlData } = await supabase.storage
      .from('reports')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    if (!signedUrlData?.signedUrl) {
      return { success: false, error: 'Failed to generate image URL' };
    }

    // Clean up temporary blob URL
    URL.revokeObjectURL(resized.url);

    return {
      success: true,
      url: signedUrlData.signedUrl,
      fileName: data.path
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Create the reports bucket if it doesn't exist (dev helper)
 */
export async function ensureReportsBucket(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'reports');

    if (!bucketExists) {
      // In development, return a stub URL
      if (import.meta.env.DEV) {
        console.warn('Reports bucket does not exist. In development mode, uploads will use stub URLs.');
        return false;
      }

      // Create bucket in production (requires admin privileges)
      const { error } = await supabase.storage.createBucket('reports', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 8 * 1024 * 1024 // 8MB
      });

      if (error) {
        console.error('Failed to create reports bucket:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking/creating reports bucket:', error);
    return false;
  }
}

/**
 * Generate a fake URL for development when bucket doesn't exist
 */
export function generateDevImageUrl(file: File): Promise<UploadResult> {
  return new Promise((resolve) => {
    // Create a temporary URL for the resized image in dev mode
    resizeImage(file).then((resized) => {
      resolve({
        success: true,
        url: resized.url,
        fileName: `dev_${Date.now()}_${file.name}`
      });
    }).catch((error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
  });
}