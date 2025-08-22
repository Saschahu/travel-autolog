import React, { useState, useRef, useEffect } from 'react';
import { ReportSignature } from '@/types/signature';
import { useSignatureStorage } from '@/hooks/useSignatureStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Move, ZoomIn, ZoomOut, Save, X } from 'lucide-react';

interface SignatureEditorProps {
  signature: ReportSignature;
  onSave: (updatedSignature: ReportSignature) => void;
  onCancel: () => void;
}

export const SignatureEditor: React.FC<SignatureEditorProps> = ({
  signature,
  onSave,
  onCancel,
}) => {
  const [position, setPosition] = useState({ x: signature.posX, y: signature.posY });
  const [scale, setScale] = useState(signature.scale);
  const [rotation, setRotation] = useState(signature.rotation || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageData, setImageData] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { loadImageFromFilesystem } = useSignatureStorage();
  const { toast } = useToast();

  // Signature field dimensions (simulate report layout)
  const FIELD_WIDTH = 300;
  const FIELD_HEIGHT = 120;

  useEffect(() => {
    const loadImage = async () => {
      try {
        const data = await loadImageFromFilesystem(signature.filePath);
        setImageData(data.startsWith('data:') ? data : `data:${signature.mimeType};base64,${data}`);
      } catch (error) {
        console.error('Error loading signature image:', error);
        toast({
          title: 'Fehler',
          description: 'Das Unterschriftsbild konnte nicht geladen werden.',
          variant: 'destructive',
        });
      }
    };

    loadImage();
  }, [signature.filePath, signature.mimeType, loadImageFromFilesystem, toast]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x * FIELD_WIDTH,
      y: e.clientY - position.y * FIELD_HEIGHT,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(1, (e.clientX - dragStart.x) / FIELD_WIDTH));
    const newY = Math.max(0, Math.min(1, (e.clientY - dragStart.y) / FIELD_HEIGHT));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(3.0, prev + delta)));
  };

  const handleReset = () => {
    setPosition({ x: 0.5, y: 0.5 });
    setScale(1.0);
    setRotation(0);
  };

  const handleCenter = () => {
    setPosition({ x: 0.5, y: 0.5 });
  };

  const handleFitToWidth = () => {
    if (signature.width && signature.height) {
      const aspectRatio = signature.width / signature.height;
      const fieldAspectRatio = FIELD_WIDTH / FIELD_HEIGHT;
      
      if (aspectRatio > fieldAspectRatio) {
        // Image is wider - fit to width
        setScale(1.0);
      } else {
        // Image is taller - fit to height
        setScale(fieldAspectRatio / aspectRatio);
      }
    }
    setPosition({ x: 0.5, y: 0.5 });
  };

  const handleSave = () => {
    const updatedSignature: ReportSignature = {
      ...signature,
      posX: position.x,
      posY: position.y,
      scale,
      rotation,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedSignature);
    toast({
      title: 'Unterschrift aktualisiert',
      description: 'Die Position und Skalierung wurden gespeichert.',
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(1, (e.clientX - rect.left - dragStart.x + position.x * FIELD_WIDTH) / FIELD_WIDTH));
      const newY = Math.max(0, Math.min(1, (e.clientY - rect.top - dragStart.y + position.y * FIELD_HEIGHT) / FIELD_HEIGHT));

      setPosition({ x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, position]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Unterschrift positionieren</h3>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Preview Field */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              Unterschriftsfeld (wie im Report):
            </p>
            <div
              ref={containerRef}
              className="relative border-2 border-dashed border-primary/20 bg-muted/10 mx-auto cursor-move"
              style={{ width: FIELD_WIDTH, height: FIELD_HEIGHT }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {imageData && (
                <img
                  src={imageData}
                  alt="Unterschrift"
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: `${position.x * 100}%`,
                    top: `${position.y * 100}%`,
                    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
                {!imageData && 'Unterschriftsfeld'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleCenter}>
              <Move className="w-4 h-4 mr-2" />
              Zentrieren
            </Button>
            <Button variant="outline" size="sm" onClick={handleFitToWidth}>
              Anpassen
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleScaleChange(0.1)}>
              <ZoomIn className="w-4 h-4 mr-2" />
              Größer
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleScaleChange(-0.1)}>
              <ZoomOut className="w-4 h-4 mr-2" />
              Kleiner
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Position: {Math.round(position.x * 100)}%, {Math.round(position.y * 100)}%<br />
              Skalierung: {Math.round(scale * 100)}%
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};