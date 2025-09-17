/**
 * Upload utilities for report images
 * Handles image uploads to Supabase storage
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a report image to Supabase storage
 * @param blob Image blob to upload
 * @returns Promise<string> - Public URL of uploaded image
 * @throws Error if upload fails
 */
export async function uploadReportImage(blob: Blob): Promise<string> {
  // Generate unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileName = `report-image-${timestamp}-${randomId}.jpg`;

  try {
    // TODO: Create 'reports' bucket if it doesn't exist
    // This is out of scope for current implementation - assumes bucket exists
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('reports')
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Could not get public URL for uploaded image');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading report image:', error);
    
    // Re-throw with more specific error messages
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error during image upload');
    }
  }
}

/**
 * Delete a report image from Supabase storage
 * @param imageUrl Public URL of the image to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export async function deleteReportImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from public URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    const fileName = pathSegments[pathSegments.length - 1];

    if (!fileName) {
      console.error('Could not extract filename from URL:', imageUrl);
      return false;
    }

    const { error } = await supabase.storage
      .from('reports')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting report image:', error);
    return false;
  }
}

/**
 * List all report images in storage
 * @returns Promise<string[]> - Array of public URLs
 */
export async function listReportImages(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('reports')
      .list();

    if (error) {
      console.error('List error:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Convert to public URLs
    const urls = data
      .filter(file => file.name.startsWith('report-image-') && file.name.endsWith('.jpg'))
      .map(file => {
        const { data: publicUrlData } = supabase.storage
          .from('reports')
          .getPublicUrl(file.name);
        return publicUrlData?.publicUrl;
      })
      .filter(Boolean) as string[];

    return urls;
  } catch (error) {
    console.error('Error listing report images:', error);
    return [];
  }
}