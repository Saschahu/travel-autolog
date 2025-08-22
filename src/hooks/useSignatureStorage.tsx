import { useState, useCallback } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ReportSignature } from '@/types/signature';
import { useToast } from '@/hooks/use-toast';

export const useSignatureStorage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateSignatureId = () => `signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const saveImageToFilesystem = useCallback(async (
    base64Data: string, 
    fileName: string,
    mimeType: "image/png" | "image/jpeg"
  ): Promise<string> => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform - use Filesystem API
        const filePath = `signatures/${fileName}`;
        await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
        return filePath;
      } else {
        // Web platform - use localStorage with size limit
        const key = `signature_${fileName}`;
        // Check size (base64 is ~4/3 of actual size)
        const sizeInBytes = (base64Data.length * 3) / 4;
        if (sizeInBytes > 2 * 1024 * 1024) { // 2MB limit
          throw new Error('Image too large for web storage');
        }
        localStorage.setItem(key, base64Data);
        return key;
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      throw error;
    }
  }, []);

  const loadImageFromFilesystem = useCallback(async (filePath: string): Promise<string> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.readFile({
          path: filePath,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
        return result.data as string;
      } else {
        const data = localStorage.getItem(filePath);
        if (!data) throw new Error('Signature not found');
        return data;
      }
    } catch (error) {
      console.error('Error loading signature:', error);
      throw error;
    }
  }, []);

  const deleteSignatureFile = useCallback(async (filePath: string): Promise<void> => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Filesystem.deleteFile({
          path: filePath,
          directory: Directory.Data
        });
      } else {
        localStorage.removeItem(filePath);
      }
    } catch (error) {
      console.error('Error deleting signature file:', error);
      // Don't throw - file might already be deleted
    }
  }, []);

  const compressImage = useCallback((
    canvas: HTMLCanvasElement, 
    maxWidth: number = 800, 
    maxHeight: number = 400,
    quality: number = 0.8
  ): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Calculate new dimensions
    let { width, height } = canvas;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;

      // Create new canvas with compressed size
      const compressedCanvas = document.createElement('canvas');
      compressedCanvas.width = width;
      compressedCanvas.height = height;
      const compressedCtx = compressedCanvas.getContext('2d');
      if (!compressedCtx) throw new Error('Could not get compressed canvas context');

      compressedCtx.drawImage(canvas, 0, 0, width, height);
      return compressedCanvas.toDataURL('image/png', quality);
    }

    return canvas.toDataURL('image/png', quality);
  }, []);

  const getImageDimensions = useCallback((base64Data: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
    });
  }, []);

  const captureFromCamera = useCallback(async (): Promise<ReportSignature> => {
    setIsLoading(true);
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 800,
        height: 400,
      });

      if (!photo.base64String) {
        throw new Error('No image data received from camera');
      }

      const base64Data = photo.base64String;
      const mimeType: "image/png" | "image/jpeg" = photo.format === 'png' ? 'image/png' : 'image/jpeg';
      const dimensions = await getImageDimensions(`data:${mimeType};base64,${base64Data}`);
      
      const signatureId = generateSignatureId();
      const fileName = `${signatureId}.png`;
      const filePath = await saveImageToFilesystem(base64Data, fileName, 'image/png');

      const signature: ReportSignature = {
        id: signatureId,
        filePath,
        mimeType: 'image/png',
        width: dimensions.width,
        height: dimensions.height,
        posX: 0.5,
        posY: 0.5,
        scale: 1.0,
        updatedAt: new Date().toISOString(),
      };

      toast({
        title: 'Unterschrift erfasst',
        description: 'Die Unterschrift wurde erfolgreich über die Kamera erfasst.',
      });

      return signature;
    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: 'Kamera-Fehler',
        description: 'Die Unterschrift konnte nicht über die Kamera erfasst werden.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveImageToFilesystem, getImageDimensions, toast]);

  const selectFromGallery = useCallback(async (): Promise<ReportSignature> => {
    setIsLoading(true);
    try {
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (event) => {
          try {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }

            // Check file size (max 5MB before compression)
            if (file.size > 5 * 1024 * 1024) {
              toast({
                title: 'Datei zu groß',
                description: 'Die Bilddatei darf maximal 5MB groß sein.',
                variant: 'destructive',
              });
              reject(new Error('File too large'));
              return;
            }

            // Convert and compress image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            const img = new Image();
            img.onload = async () => {
              try {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);

                const compressedDataUrl = compressImage(canvas);
                const base64Data = compressedDataUrl.split(',')[1];
                const dimensions = { width: img.naturalWidth, height: img.naturalHeight };

                const signatureId = generateSignatureId();
                const fileName = `${signatureId}.png`;
                const filePath = await saveImageToFilesystem(base64Data, fileName, 'image/png');

                const signature: ReportSignature = {
                  id: signatureId,
                  filePath,
                  mimeType: 'image/png',
                  width: dimensions.width,
                  height: dimensions.height,
                  posX: 0.5,
                  posY: 0.5,
                  scale: 1.0,
                  updatedAt: new Date().toISOString(),
                };

                toast({
                  title: 'Unterschrift gespeichert',
                  description: 'Die Unterschrift wurde erfolgreich hochgeladen.',
                });

                resolve(signature);
              } catch (error) {
                reject(error);
              }
            };

            img.onerror = () => reject(new Error('Could not load image'));
            
            const reader = new FileReader();
            reader.onload = (e) => {
              img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
          } catch (error) {
            reject(error);
          }
        };
        
        input.click();
      });
    } catch (error) {
      console.error('Gallery selection error:', error);
      toast({
        title: 'Galerie-Fehler',
        description: 'Die Unterschrift konnte nicht aus der Galerie geladen werden.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveImageToFilesystem, compressImage, toast]);

  return {
    isLoading,
    captureFromCamera,
    selectFromGallery,
    loadImageFromFilesystem,
    deleteSignatureFile,
  };
};