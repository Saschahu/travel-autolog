import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useSignatureStorage } from '@/hooks/useSignatureStorage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SignatureEditor } from '@/components/signature/SignatureEditor';
import { Camera as CameraIcon, Upload, Trash2, Eye, Edit } from 'lucide-react';
import { ReportSignature } from '@/types/signature';

export const SignatureUpload: React.FC = () => {
  const { profile, updateProfile } = useUserProfile();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [previewImageData, setPreviewImageData] = useState<string>('');
  
  const { 
    isLoading,
    captureFromCamera, 
    selectFromGallery, 
    loadImageFromFilesystem,
    deleteSignatureFile 
  } = useSignatureStorage();

  const handleCameraCapture = async () => {
    try {
      if (Capacitor.getPlatform() === 'web') {
        toast({
          title: 'Kamera nicht verfügbar',
          description: 'Kamera-Funktion ist nur auf mobilen Geräten verfügbar. Bitte verwenden Sie die Upload-Option.',
          variant: 'destructive',
        });
        return;
      }

      const signature = await captureFromCamera();
      await updateProfile({ reportSignature: signature });
      
      // Ask if user wants to position the signature
      setTimeout(() => {
        if (window.confirm('Möchten Sie die Unterschrift jetzt positionieren?')) {
          setShowEditor(true);
        }
      }, 500);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleFileUpload = async () => {
    try {
      const signature = await selectFromGallery();
      await updateProfile({ reportSignature: signature });
      
      // Ask if user wants to position the signature
      setTimeout(() => {
        if (window.confirm('Möchten Sie die Unterschrift jetzt positionieren?')) {
          setShowEditor(true);
        }
      }, 500);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleRemoveSignature = async () => {
    try {
      // Delete the file if it exists
      if (profile.reportSignature?.filePath) {
        await deleteSignatureFile(profile.reportSignature.filePath);
      }
      
      await updateProfile({ reportSignature: null });
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

  const handleEditSignature = () => {
    setShowEditor(true);
  };

  const handleSaveSignature = async (updatedSignature: ReportSignature) => {
    await updateProfile({ reportSignature: updatedSignature });
    setShowEditor(false);
  };

  const handleShowPreview = async () => {
    if (profile.reportSignature?.filePath) {
      try {
        const data = await loadImageFromFilesystem(profile.reportSignature.filePath);
        const imageData = data.startsWith('data:') ? data : `data:${profile.reportSignature.mimeType};base64,${data}`;
        setPreviewImageData(imageData);
        setShowPreview(true);
      } catch (error) {
        toast({
          title: 'Fehler',
          description: 'Die Unterschrift konnte nicht geladen werden.',
          variant: 'destructive',
        });
      }
    }
  };

  console.log('SignatureUpload render:', { 
    hasReportSignature: !!profile.reportSignature,
    hasSignatureImage: !!profile.signatureImage,
    profileKeys: Object.keys(profile)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unterschrift für Reports</CardTitle>
        <CardDescription>
          Laden Sie eine Unterschrift hoch, die automatisch in exportierte Reports eingefügt wird.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(profile.reportSignature || profile.signatureImage) ? (
          <div className="space-y-4">
            <div className="p-4 border border-muted rounded-lg bg-muted/10">
              <p className="text-sm text-muted-foreground mb-2">Aktuelle Unterschrift:</p>
              <div className="w-full max-w-md mx-auto">
                <div className="h-20 border border-border rounded bg-background flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    {profile.reportSignature 
                      ? `Unterschrift gespeichert (${new Date(profile.reportSignature.updatedAt).toLocaleDateString('de-DE')})`
                      : 'Unterschrift gespeichert (alt)'}
                  </span>
                </div>
              </div>
              {profile.reportSignature && (
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Position: {Math.round(profile.reportSignature.posX * 100)}%, {Math.round(profile.reportSignature.posY * 100)}% | 
                  Skalierung: {Math.round(profile.reportSignature.scale * 100)}%
                </div>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowPreview}
                disabled={!profile.reportSignature}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vorschau
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditSignature}
                disabled={!profile.reportSignature}
              >
                <Edit className="w-4 h-4 mr-2" />
                Positionieren
              </Button>
              
              {profile.signatureImage && !profile.reportSignature && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    // Convert old signature to new format
                    try {
                      const signature: ReportSignature = {
                        id: `migrated_${Date.now()}`,
                        filePath: 'legacy_signature',
                        mimeType: 'image/png',
                        posX: 0.5,
                        posY: 0.5,
                        scale: 1.0,
                        updatedAt: new Date().toISOString(),
                      };
                      await updateProfile({ reportSignature: signature });
                      toast({
                        title: 'Migration abgeschlossen',
                        description: 'Alte Unterschrift wurde in das neue Format konvertiert.',
                      });
                    } catch (error) {
                      console.error('Migration error:', error);
                    }
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Zu neuem Format konvertieren
                </Button>
              )}
              
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
                    <AlertDialogAction onClick={async () => {
                      // Remove both old and new signature fields
                      if (profile.reportSignature?.filePath) {
                        await deleteSignatureFile(profile.reportSignature.filePath);
                      }
                      await updateProfile({ 
                        reportSignature: null,
                        signatureImage: undefined 
                      });
                      toast({
                        title: 'Unterschrift entfernt',
                        description: 'Die gespeicherte Unterschrift wurde entfernt.',
                      });
                    }}>
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
            disabled={isLoading}
            variant="default"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? 'Hochladen...' : 'Aus Galerie wählen'}
          </Button>
          
          {Capacitor.getPlatform() !== 'web' && (
            <Button
              onClick={handleCameraCapture}
              disabled={isLoading}
              variant="outline"
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              {isLoading ? 'Aufnehmen...' : 'Mit Kamera aufnehmen'}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Unterstützte Formate: JPG, PNG</p>
          <p>• Maximale Dateigröße: 5MB (wird automatisch komprimiert)</p>
          <p>• Empfohlene Abmessungen: 800x400 Pixel</p>
          <p>• Die Unterschrift wird automatisch in alle exportierten Reports eingefügt</p>
          <p>• Nach dem Upload können Sie die Position und Größe anpassen</p>
        </div>

        {/* Editor Modal */}
        {showEditor && profile.reportSignature && (
          <SignatureEditor
            signature={profile.reportSignature}
            onSave={handleSaveSignature}
            onCancel={() => setShowEditor(false)}
          />
        )}

        {/* Preview Modal */}
        {showPreview && previewImageData && (
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
                  src={previewImageData} 
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