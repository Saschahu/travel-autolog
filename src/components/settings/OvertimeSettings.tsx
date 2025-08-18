import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { OvertimeSettings as OvertimeSettingsType } from '@/types/overtime';
import { useToast } from '@/hooks/use-toast';

export const OvertimeSettings = () => {
  const { overtimeSettings, saveSettings } = useOvertimeCalculation();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<OvertimeSettingsType>(overtimeSettings);

  const handleAddSlot = () => {
    const newSlot = {
      id: Date.now().toString(),
      start: '08:00',
      end: '16:00',
      rate: 50,
      name: 'Neue Zeitspanne'
    };
    
    setLocalSettings(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot]
    }));
  };

  const handleRemoveSlot = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.id !== id)
    }));
  };

  const handleSlotChange = (id: string, field: string, value: string | number) => {
    setLocalSettings(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot => 
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSave = () => {
    saveSettings(localSettings);
    toast({
      title: 'Gespeichert',
      description: 'Überstunden-Einstellungen wurden erfolgreich gespeichert.'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Überstunden-Zuschläge konfigurieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {localSettings.timeSlots.map((slot) => (
            <div key={slot.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{slot.name}</Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveSlot(slot.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${slot.id}`}>Name</Label>
                  <Input
                    id={`name-${slot.id}`}
                    value={slot.name}
                    onChange={(e) => handleSlotChange(slot.id, 'name', e.target.value)}
                    placeholder="Zeitspanne Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`rate-${slot.id}`}>Zuschlag (%)</Label>
                  <Input
                    id={`rate-${slot.id}`}
                    type="number"
                    min="0"
                    max="200"
                    value={slot.rate}
                    onChange={(e) => handleSlotChange(slot.id, 'rate', parseInt(e.target.value) || 0)}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`start-${slot.id}`}>Start-Zeit</Label>
                  <Input
                    id={`start-${slot.id}`}
                    type="time"
                    value={slot.start}
                    onChange={(e) => handleSlotChange(slot.id, 'start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`end-${slot.id}`}>End-Zeit</Label>
                  <Input
                    id={`end-${slot.id}`}
                    type="time"
                    value={slot.end}
                    onChange={(e) => handleSlotChange(slot.id, 'end', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* Weekend Settings */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="weekend-enabled">Wochenend-Zuschläge</Label>
                <p className="text-sm text-muted-foreground">
                  Automatische Zuschläge von Freitag Abend bis Montag Morgen
                </p>
              </div>
              <Switch
                id="weekend-enabled"
                checked={localSettings.weekendEnabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, weekendEnabled: checked }))
                }
              />
            </div>
            
            {localSettings.weekendEnabled && (
              <div className="space-y-2">
                <Label htmlFor="weekend-rate">Wochenend-Zuschlag (%)</Label>
                <Input
                  id="weekend-rate"
                  type="number"
                  min="0"
                  max="200"
                  value={localSettings.weekendRate}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      weekendRate: parseInt(e.target.value) || 0 
                    }))
                  }
                  placeholder="100"
                />
              </div>
            )}
          </div>
          
          
          {/* Core Work Hours Settings */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="space-y-1">
              <Label>Kernarbeitszeit</Label>
              <p className="text-sm text-muted-foreground">
                Reguläre Arbeitszeiten - alles außerhalb ist Überstunden
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="core-start">Start</Label>
                <Input
                  id="core-start"
                  type="time"
                  value={localSettings.coreWorkStart}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      coreWorkStart: e.target.value 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="core-end">Ende</Label>
                <Input
                  id="core-end"
                  type="time"
                  value={localSettings.coreWorkEnd}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      coreWorkEnd: e.target.value 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guaranteed-hours">Garantierte Stunden</Label>
                <Input
                  id="guaranteed-hours"
                  type="number"
                  min="1"
                  max="24"
                  value={localSettings.guaranteedHours}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      guaranteedHours: parseInt(e.target.value) || 8 
                    }))
                  }
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAddSlot}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Zeitspanne hinzufügen
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Kernarbeitszeit:</strong> Reguläre Arbeitszeit (Standard: 8-16 Uhr)</p>
          <p>• <strong>Garantierte Stunden:</strong> Mindestbezahlung pro Tag (Standard: 8h)</p>
          <p>• <strong>Überstunden:</strong> Alle Zeiten außerhalb der Kernarbeitszeit</p>
          <p>• <strong>Zuschläge:</strong> Prozentuale Aufschläge für verschiedene Uhrzeiten</p>
          <p>• <strong>Wochenend-Zuschläge:</strong> Freitag Abend bis Montag Morgen (100%)</p>
          <p>• <strong>Bezahlung:</strong> Mindestens garantierte Stunden + Überstundenzuschläge</p>
        </CardContent>
      </Card>
    </div>
  );
};