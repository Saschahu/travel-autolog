import { Briefcase, Home, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface LeavingHomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelection: (type: 'work' | 'private') => void;
}

export const LeavingHomeDialog = ({ isOpen, onClose, onSelection }: LeavingHomeDialogProps) => {
  const [selectedType, setSelectedType] = useState<'work' | 'private' | null>(null);

  const handleConfirm = () => {
    if (selectedType) {
      onSelection(selectedType);
      setSelectedType(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Standort verlassen
          </DialogTitle>
          <DialogDescription>
            Du hast dein Zuhause verlassen. Wählst du arbeit oder privat?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Card 
            className={`cursor-pointer transition-all ${
              selectedType === 'work' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedType('work')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  selectedType === 'work' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Arbeit</h3>
                  <p className="text-sm text-muted-foreground">
                    Dienstliche Reise oder Arbeitsweg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${
              selectedType === 'private' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedType('private')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  selectedType === 'private' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Home className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Privat</h3>
                  <p className="text-sm text-muted-foreground">
                    Persönliche Aktivitäten oder Freizeit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Automatische Zeiterfassung startet nach Auswahl</span>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedType}
            className="min-w-20"
          >
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};