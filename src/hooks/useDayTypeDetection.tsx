import { useState, useEffect, useCallback } from 'react';
import type { 
  DayTypeResult, 
  DayOverrides, 
  HolidaySettings} from '@/lib/holidays';
import { 
  getDayType, 
  loadHolidaySettings 
} from '@/lib/holidays';

interface DayTypeCache {
  [date: string]: DayTypeResult;
}

export const useDayTypeDetection = () => {
  const [holidaySettings, setHolidaySettings] = useState<HolidaySettings | null>(null);
  const [cache, setCache] = useState<DayTypeCache>({});

  // Load holiday settings on mount
  useEffect(() => {
    const settings = loadHolidaySettings();
    setHolidaySettings(settings);
  }, []);

  // Clear cache when settings change
  useEffect(() => {
    setCache({});
  }, [holidaySettings]);

  const detectDayType = useCallback(async (
    isoDate: string, 
    overrides?: DayOverrides
  ): Promise<DayTypeResult> => {
    if (!holidaySettings) {
      // Fallback: basic weekend detection
      const date = new Date(isoDate);
      const dayOfWeek = date.getDay();
      
      if (overrides?.holiday?.enabled) {
        return {
          type: 'holiday',
          holidayName: overrides.holiday.name || 'Benutzerdefinierter Feiertag',
          source: 'override'
        };
      }
      
      if (overrides?.saturday || dayOfWeek === 6) {
        return { type: 'saturday', source: overrides?.saturday ? 'override' : 'weekend' };
      }
      
      if (overrides?.sunday || dayOfWeek === 0) {
        return { type: 'sunday', source: overrides?.sunday ? 'override' : 'weekend' };
      }
      
      return { type: 'weekday' };
    }

    // Create cache key including overrides
    const cacheKey = `${isoDate}_${JSON.stringify(overrides || {})}`;
    
    // Check cache first
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    try {
      const result = await getDayType(isoDate, overrides, holidaySettings);
      
      // Cache the result
      setCache(prev => ({
        ...prev,
        [cacheKey]: result
      }));
      
      return result;
    } catch (error) {
      console.error('Error detecting day type:', error);
      
      // Fallback to basic weekend detection
      const date = new Date(isoDate);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 6) return { type: 'saturday', source: 'weekend' };
      if (dayOfWeek === 0) return { type: 'sunday', source: 'weekend' };
      return { type: 'weekday' };
    }
  }, [holidaySettings, cache]);

  const refreshSettings = useCallback(() => {
    const settings = loadHolidaySettings();
    setHolidaySettings(settings);
    setCache({});
  }, []);

  return {
    detectDayType,
    refreshSettings,
    holidaySettings
  };
};