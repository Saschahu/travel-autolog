import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DayOverrides } from '@/lib/holidays';

interface TimeEntryOverridesProps {
  overrides: DayOverrides;
  onOverridesChange: (overrides: DayOverrides) => void;
  className?: string;
}

export const TimeEntryOverrides = ({ 
  overrides, 
  onOverridesChange, 
  className = "" 
}: TimeEntryOverridesProps) => {
  const handleSaturdayChange = (checked: boolean) => {
    onOverridesChange({
      ...overrides,
      saturday: checked || undefined
    });
  };

  const handleSundayChange = (checked: boolean) => {
    onOverridesChange({
      ...overrides,
      sunday: checked || undefined
    });
  };

  const handleHolidayChange = (checked: boolean) => {
    onOverridesChange({
      ...overrides,
      holiday: checked 
        ? { enabled: true, name: overrides.holiday?.name }
        : undefined
    });
  };

  const handleHolidayNameChange = (name: string) => {
    if (overrides.holiday?.enabled) {
      onOverridesChange({
        ...overrides,
        holiday: { enabled: true, name }
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">Manuelle Einstellungen</Label>
      
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="override-saturday"
            checked={overrides.saturday || false}
            onCheckedChange={handleSaturdayChange}
          />
          <Label htmlFor="override-saturday" className="text-sm">
            Samstag
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="override-sunday"
            checked={overrides.sunday || false}
            onCheckedChange={handleSundayChange}
          />
          <Label htmlFor="override-sunday" className="text-sm">
            Sonntag
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="override-holiday"
            checked={overrides.holiday?.enabled || false}
            onCheckedChange={handleHolidayChange}
          />
          <Label htmlFor="override-holiday" className="text-sm">
            Feiertag
          </Label>
        </div>
      </div>

      {overrides.holiday?.enabled && (
        <div className="ml-6 space-y-1">
          <Label htmlFor="holiday-name" className="text-xs text-muted-foreground">
            Feiertagsname (optional)
          </Label>
          <Input
            id="holiday-name"
            placeholder="z.B. Betriebsfeier"
            value={overrides.holiday.name || ''}
            onChange={(e) => handleHolidayNameChange(e.target.value)}
            className="max-w-xs"
          />
        </div>
      )}
    </div>
  );
};