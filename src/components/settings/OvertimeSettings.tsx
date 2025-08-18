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
          {/* Hour-based Overtime Settings */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="space-y-1">
              <Label>Stundenbasierte Überstunden</Label>
              <p className="text-sm text-muted-foreground">
                Überstunden basierend auf Gesamtarbeitszeit pro Tag
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overtime-threshold-1">Erste Überstunden ab (Stunden)</Label>
                <Input
                  id="overtime-threshold-1"
                  type="number"
                  min="1"
                  max="24"
                  value={localSettings.overtimeThreshold1}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      overtimeThreshold1: parseInt(e.target.value) || 8 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime-rate-1">Zuschlag 8-12h (%)</Label>
                <Input
                  id="overtime-rate-1"
                  type="number"
                  min="0"
                  max="200"
                  value={localSettings.overtimeRate1}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      overtimeRate1: parseInt(e.target.value) || 50 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime-threshold-2">Zweite Überstunden ab (Stunden)</Label>
                <Input
                  id="overtime-threshold-2"
                  type="number"
                  min="1"
                  max="24"
                  value={localSettings.overtimeThreshold2}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      overtimeThreshold2: parseInt(e.target.value) || 12 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime-rate-2">Zuschlag über 12h (%)</Label>
                <Input
                  id="overtime-rate-2"
                  type="number"
                  min="0"
                  max="200"
                  value={localSettings.overtimeRate2}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ 
                      ...prev, 
                      overtimeRate2: parseInt(e.target.value) || 100 
                    }))
                  }
                />
              </div>
            </div>
          </div>
          
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saturday-rate">Samstag-Zuschlag (%)</Label>
                  <Input
                    id="saturday-rate"
                    type="number"
                    min="0"
                    max="200"
                    value={localSettings.saturdayRate}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ 
                        ...prev, 
                        saturdayRate: parseInt(e.target.value) || 50 
                      }))
                    }
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sunday-rate">Sonntag/Feiertag-Zuschlag (%)</Label>
                  <Input
                    id="sunday-rate"
                    type="number"
                    min="0"
                    max="200"
                    value={localSettings.sundayRate}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ 
                        ...prev, 
                        sundayRate: parseInt(e.target.value) || 100 
                      }))
                    }
                    placeholder="100"
                  />
                </div>
              </div>
            )}
          </div>
          
          
          {/* Guaranteed Hours Settings */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="space-y-1">
              <Label>Garantierte Stunden</Label>
              <p className="text-sm text-muted-foreground">
                Mindestbezahlung pro Tag, unabhängig von der tatsächlichen Arbeitszeit
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guaranteed-hours">Garantierte Stunden pro Tag</Label>
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
          
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="w-full"
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
          <p>• <strong>Garantierte Stunden:</strong> Mindestbezahlung pro Tag (Standard: 8h)</p>
          <p>• <strong>8-12 Stunden:</strong> 50% Zuschlag auf Überstunden</p>
          <p>• <strong>Über 12 Stunden:</strong> 100% Zuschlag auf Überstunden</p>
          <p>• <strong>Samstag:</strong> 50% Zuschlag auf alle Stunden</p>
          <p>• <strong>Sonntag/Feiertag:</strong> 100% Zuschlag auf alle Stunden</p>
          <p>• <strong>Bezahlung:</strong> Mindestens garantierte Stunden + Überstundenzuschläge</p>
        </CardContent>
      </Card>
    </div>
  );
};