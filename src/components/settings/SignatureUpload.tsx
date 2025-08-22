import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Camera as CameraIcon, Upload, Trash2, Eye } from 'lucide-react';

export const SignatureUpload: React.FC = () => {
  const { profile, updateProfile } = useUserProfile();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCameraCapture = async () => {
    setIsUploading(true);
    try {
      // Check if camera is available
      if (Capacitor.getPlatform() === 'web') {
        toast({
          title: 'Kamera nicht verfügbar',
          description: 'Kamera-Funktion ist nur auf mobilen Geräten verfügbar. Bitte verwenden Sie die Upload-Option.',
          variant: 'destructive',
        });
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 600,
        height: 400,
      });

      if (photo.base64String) {
        const base64Image = `data:image/jpeg;base64,${photo.base64String}`;
        await updateProfile({ signatureImage: base64Image });
        
        toast({
          title: 'Unterschrift gespeichert',
          description: 'Die Unterschrift wurde erfolgreich über die Kamera erfasst.',
        });
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: 'Fehler beim Fotografieren',
        description: 'Die Unterschrift konnte nicht über die Kamera erfasst werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async () => {
    setIsUploading(true);
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          // Check file size (max 2MB)
          if (file.size > 2 * 1024 * 1024) {
            toast({
              title: 'Datei zu groß',
              description: 'Die Bilddatei darf maximal 2MB groß sein.',
              variant: 'destructive',
            });
            setIsUploading(false);
            return;
          }

          // Convert to base64
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Image = e.target?.result as string;
            await updateProfile({ signatureImage: base64Image });
            
            toast({
              title: 'Unterschrift gespeichert',
              description: 'Die Unterschrift wurde erfolgreich hochgeladen.',
            });
            setIsUploading(false);
          };
          
          reader.onerror = () => {
            toast({
              title: 'Fehler beim Hochladen',
              description: 'Die Bilddatei konnte nicht gelesen werden.',
              variant: 'destructive',
            });
            setIsUploading(false);
          };
          
          reader.readAsDataURL(file);
        } else {
          setIsUploading(false);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Fehler beim Hochladen',
        description: 'Die Unterschrift konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  const handleRemoveSignature = async () => {
    try {
      await updateProfile({ signatureImage: undefined });
      toast({
        title: 'Unterschrift entfernt',
        description: 'Die gespeicherte Unterschrift wurde entfernt.',
      });
    } catch (error) {
      console.error('Remove signature error:', error);
      toast({
        title: 'Fehler',
        description: 'Die Unterschrift konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unterschrift für Reports</CardTitle>
        <CardDescription>
          Laden Sie eine Unterschrift hoch, die automatisch in exportierte Reports eingefügt wird.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.signatureImage ? (
          <div className="space-y-4">
            <div className="p-4 border border-muted rounded-lg bg-muted/10">
              <p className="text-sm text-muted-foreground mb-2">Aktuelle Unterschrift:</p>
              <div className="w-full max-w-md mx-auto">
                <img 
                  src={profile.signatureImage} 
                  alt="Gespeicherte Unterschrift" 
                  className="w-full h-20 object-contain border border-border rounded"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vorschau
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Entfernen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unterschrift entfernen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Möchten Sie die gespeicherte Unterschrift wirklich entfernen? 
                      Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveSignature}>
                      Entfernen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-muted-foreground mb-4">Keine Unterschrift gespeichert</p>
            <p className="text-sm text-muted-foreground mb-4">
              In Reports wird "Keine Unterschrift hinterlegt" angezeigt.
            </p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleFileUpload}
            disabled={isUploading}
            variant="default"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Hochladen...' : 'Datei hochladen'}
          </Button>
          
          {Capacitor.getPlatform() !== 'web' && (
            <Button
              onClick={handleCameraCapture}
              disabled={isUploading}
              variant="outline"
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              {isUploading ? 'Aufnehmen...' : 'Kamera öffnen'}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Unterstützte Formate: JPG, PNG, WebP</p>
          <p>• Maximale Dateigröße: 2MB</p>
          <p>• Empfohlene Abmessungen: 600x400 Pixel</p>
          <p>• Die Unterschrift wird automatisch in alle exportierten Reports eingefügt</p>
        </div>

        {/* Preview Modal */}
        {showPreview && profile.signatureImage && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <div 
              className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Unterschrift Vorschau</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  Schließen
                </Button>
              </div>
              <div className="w-full text-center">
                <img 
                  src={profile.signatureImage} 
                  alt="Unterschrift Vorschau" 
                  className="max-w-full max-h-96 object-contain border border-border rounded mx-auto"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};