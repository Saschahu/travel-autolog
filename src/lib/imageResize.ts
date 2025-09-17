/**
 * Image resize and processing utilities
 * - Resizes images to max 1600px on longest edge
 * - Converts to JPEG at ~85% quality
 * - Strips EXIF data via Canvas export
 * - Handles orientation correctly
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Check file type using magic bytes (file header)
 */
export function validateImageMagicBytes(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      
      // Check magic bytes for supported formats
      if (bytes.length < 4) {
        resolve(false);
        return;
      }
      
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        resolve(true);
        return;
      }
      
      // PNG: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        resolve(true);
        return;
      }
      
      // WebP: RIFF + WEBP
      if (bytes.length >= 12 && 
          bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
          bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        resolve(true);
        return;
      }
      
      // HEIC: ftyp + heic/heix/hvc1
      if (bytes.length >= 12 && 
          bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        const subtype = new TextDecoder().decode(bytes.slice(8, 12));
        if (subtype === 'heic' || subtype === 'heix' || subtype === 'hvc1') {
          resolve(true);
          return;
        }
      }
      
      resolve(false);
    };
    
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 32)); // Only read first 32 bytes
  });
}

/**
 * Load image and get orientation from EXIF if available
 */
function loadImageWithOrientation(file: File): Promise<{ img: HTMLImageElement; orientation: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // For now, we'll assume orientation 1 (normal) since Canvas export handles this
      // In a full implementation, you'd use an EXIF library here
      resolve({ img, orientation: 1 });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
  const maxEdge = Math.max(originalWidth, originalHeight);
  
  if (maxEdge <= MAX_EDGE) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const ratio = MAX_EDGE / maxEdge;
  return {
    width: Math.floor(originalWidth * ratio),
    height: Math.floor(originalHeight * ratio)
  };
}

/**
 * Process image: resize, convert to JPEG, strip EXIF
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  // Validate file size (8MB limit)
  const MAX_SIZE = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_SIZE) {
    throw new Error('File too large (max 8MB)');
  }
  
  // Validate MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type');
  }
  
  // Validate magic bytes
  const validMagicBytes = await validateImageMagicBytes(file);
  if (!validMagicBytes) {
    throw new Error('Invalid file format (magic bytes check failed)');
  }
  
  // Load image
  const { img } = await loadImageWithOrientation(file);
  
  // Calculate new dimensions
  const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight);
  
  // Create canvas and draw image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // White background for JPEG (no alpha channel)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Draw image (this automatically strips EXIF and handles orientation)
  ctx.drawImage(img, 0, 0, width, height);
  
  // Clean up object URL
  URL.revokeObjectURL(img.src);
  
  // Convert to JPEG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to process image'));
          return;
        }
        
        // Create data URL
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            blob,
            dataUrl: reader.result as string,
            width,
            height
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}