/**
 * Image resizing utilities for report editor
 * Resizes images to specified maximum dimensions while maintaining aspect ratio
 */

export interface ResizeOptions {
  maxEdge?: number;
  quality?: number;
}

/**
 * Resize an image (File or Blob) to JPEG format with specified constraints
 * @param input File or Blob containing image data
 * @param options Resize options with maxEdge (default: 1600) and quality (default: 0.85)
 * @returns Promise<Blob> - Resized JPEG image as Blob
 */
export async function resizeToJpeg(
  input: File | Blob, 
  options: ResizeOptions = {}
): Promise<Blob> {
  const { maxEdge = 1600, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    // Create image element to load the input
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxEdge || height > maxEdge) {
          if (width > height) {
            height = (height * maxEdge) / width;
            width = maxEdge;
          } else {
            width = (width * maxEdge) / height;
            height = maxEdge;
          }
        }

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const url = URL.createObjectURL(input);
    img.src = url;
    
    // Clean up URL after loading
    img.onload = () => {
      URL.revokeObjectURL(url);
      img.onload(); // Call original handler
    };
  });
}

/**
 * Validate image file size and type
 * @param file File to validate
 * @param maxSizeMB Maximum file size in MB (default: 8)
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateImageFile(file: File, maxSizeMB: number = 8): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File is not an image' };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` };
  }

  return { isValid: true };
}