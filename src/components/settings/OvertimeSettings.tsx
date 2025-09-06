import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { overtimeSettings, saveSettings } = useOvertimeCalculation();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<OvertimeSettingsType>(overtimeSettings);


  const handleSave = () => {
    saveSettings(localSettings);
    toast({
      title: t('saved'),
      description: t('overtimeSettingsSaved')
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('overtimeSettingsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hour-based Overtime Settings */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="space-y-1">
              <Label>{t('hourBasedOvertime')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('overtimeDescription')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overtime-threshold-1">{t('firstOvertimeFrom')}</Label>
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
                <Label htmlFor="overtime-rate-1">{t('surcharge8to12h')}</Label>
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
                <Label htmlFor="overtime-threshold-2">{t('secondOvertimeFrom')}</Label>
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
                <Label htmlFor="overtime-rate-2">{t('surchargeOver12h')}</Label>
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
                <Label htmlFor="weekend-enabled">{t('weekendSurcharges')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('weekendDescription')}
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
                  <Label htmlFor="saturday-rate">{t('saturdaySurcharge')}</Label>
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
                  <Label htmlFor="sunday-rate">{t('sundayHolidaySurcharge')}</Label>
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
              <Label>{t('guaranteedHoursConfig')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('guaranteedHoursDescription')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guaranteed-hours">{t('guaranteedHoursPerDay')}</Label>
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
              {t('save')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('notesSection')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t('overtimeRules')}</p>
          <p>{t('rule8to12')}</p>
          <p>{t('ruleOver12')}</p>
          <p>{t('weekendRules')}</p>
          <p>{t('payment')}</p>
        </CardContent>
      </Card>
    </div>
  );
};