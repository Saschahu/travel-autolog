import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import Holidays from 'date-holidays';
import ICAL from 'ical.js';

export type DayType = 'weekday' | 'saturday' | 'sunday' | 'holiday';

export type HolidaySource =
  | { kind: 'builtin'; country: string; region?: string }
  | { kind: 'ics'; id: string; name: string };

export type HolidaySettings = {
  country: string;
  region?: string;
  sources: HolidaySource[];
  timezone?: string;
};

export type DayTypeResult = {
  type: DayType;
  holidayName?: string;
  source?: 'builtin' | 'ics' | 'override' | 'weekend';
};

export type DayOverrides = {
  saturday?: boolean;
  sunday?: boolean;
  holiday?: { enabled: boolean; name?: string };
};

// Cache for built-in holidays
const holidayCache = new Map<string, any[]>();

// Default settings
export const DEFAULT_HOLIDAY_SETTINGS: HolidaySettings = {
  country: 'DE',
  region: 'DE-BW',
  sources: [{ kind: 'builtin', country: 'DE', region: 'DE-BW' }],
  timezone: 'Europe/Berlin'
};

// Get available countries and regions
export const getAvailableCountries = (): { code: string; name: string }[] => {
  try {
    const hd = new Holidays();
    const countries = hd.getCountries ? hd.getCountries() : ['DE', 'AT', 'CH', 'US', 'GB', 'FR'];
    return Array.isArray(countries) ? countries.map(country => ({
      code: String(country),
      name: String(country)
    })) : countries ? Object.keys(countries).map(code => ({
      code,
      name: code
    })) : [{ code: 'DE', name: 'DE' }];
  } catch (error) {
    console.warn('Failed to get countries:', error);
    return [{ code: 'DE', name: 'DE' }];
  }
};

export const getAvailableRegions = (country: string): { code: string; name: string }[] => {
  try {
    const hd = new Holidays(country);
    const states = hd.getStates ? hd.getStates(country) : {};
    return Object.keys(states).map(state => ({
      code: state,
      name: states[state]
    }));
  } catch (error) {
    console.warn('Failed to get regions for', country, error);
    return [];
  }
};

// ICS Event storage
export const saveICSEvents = async (id: string, name: string, icsContent: string): Promise<void> => {
  try {
    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const events = vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      const startDate = event.startDate ? event.startDate.toJSDate() : null;
      const endDate = event.endDate ? event.endDate.toJSDate() : null;
      
      return {
        summary: event.summary,
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
        isAllDay: !startDate || startDate.toTimeString().startsWith('00:00:00')
      };
    }).filter(event => event.startDate); // Only events with valid dates
    
    localStorage.setItem(`holiday_ics_${id}`, JSON.stringify({ name, events }));
  } catch (error) {
    console.error('Failed to parse ICS file:', error);
    throw new Error('Invalid ICS file format');
  }
};

export const getICSEvents = (id: string): any[] => {
  try {
    const stored = localStorage.getItem(`holiday_ics_${id}`);
    if (!stored) return [];
    const data = JSON.parse(stored);
    return data.events || [];
  } catch {
    return [];
  }
};

export const removeICSCalendar = (id: string): void => {
  localStorage.removeItem(`holiday_ics_${id}`);
};

export const listICSCalendars = (): { id: string; name: string; eventCount: number }[] => {
  const calendars: { id: string; name: string; eventCount: number }[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('holiday_ics_')) {
      const id = key.replace('holiday_ics_', '');
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          calendars.push({
            id,
            name: data.name || id,
            eventCount: data.events?.length || 0
          });
        }
      } catch {
        // Skip invalid entries
      }
    }
  }
  
  return calendars;
};

// Get built-in holidays for a year
const getBuiltinHolidays = (year: number, country: string, region?: string): any[] => {
  const cacheKey = `${year}-${country}-${region || ''}`;
  
  if (holidayCache.has(cacheKey)) {
    return holidayCache.get(cacheKey)!;
  }
  
  try {
    const hd = new Holidays(country, region);
    const holidays = hd.getHolidays(year);
    holidayCache.set(cacheKey, holidays);
    return holidays;
  } catch (error) {
    console.warn('Failed to get holidays:', error);
    return [];
  }
};

// Check if date matches any ICS events
const checkICSHoliday = (date: string, sources: HolidaySource[]): { name: string; source: string } | null => {
  for (const source of sources) {
    if (source.kind === 'ics') {
      const events = getICSEvents(source.id);
      for (const event of events) {
        if (event.startDate === date || 
            (event.endDate && date >= event.startDate && date <= event.endDate)) {
          return { name: event.summary, source: source.name };
        }
      }
    }
  }
  return null;
};

// Check if date is a built-in holiday
const checkBuiltinHoliday = (date: string, country: string, region?: string): { name: string } | null => {
  const year = new Date(date).getFullYear();
  const holidays = getBuiltinHolidays(year, country, region);
  
  for (const holiday of holidays) {
    const holidayDate = format(holiday.date, 'yyyy-MM-dd');
    if (holidayDate === date) {
      return { name: holiday.name };
    }
  }
  
  return null;
};

// Main function to determine day type
export const getDayType = async (
  isoDate: string,
  overrides?: DayOverrides,
  settings: HolidaySettings = DEFAULT_HOLIDAY_SETTINGS
): Promise<DayTypeResult> => {
  // 1. Check overrides first
  if (overrides) {
    if (overrides.holiday?.enabled) {
      return {
        type: 'holiday',
        holidayName: overrides.holiday.name || 'Benutzerdefinierter Feiertag',
        source: 'override'
      };
    }
    if (overrides.saturday) {
      return { type: 'saturday', source: 'override' };
    }
    if (overrides.sunday) {
      return { type: 'sunday', source: 'override' };
    }
  }
  
  // 2. Check ICS calendars (higher priority than built-in)
  const icsHoliday = checkICSHoliday(isoDate, settings.sources);
  if (icsHoliday) {
    return {
      type: 'holiday',
      holidayName: icsHoliday.name,
      source: 'ics'
    };
  }
  
  // 3. Check built-in holidays
  const builtinHoliday = checkBuiltinHoliday(isoDate, settings.country, settings.region);
  if (builtinHoliday) {
    return {
      type: 'holiday',
      holidayName: builtinHoliday.name,
      source: 'builtin'
    };
  }
  
  // 4. Check weekends (use timezone if specified)
  const timezone = settings.timezone || 'Europe/Berlin';
  const date = parseISO(isoDate);
  const zonedDate = toZonedTime(date, timezone);
  const dayOfWeek = zonedDate.getDay();
  
  if (dayOfWeek === 6) {
    return { type: 'saturday', source: 'weekend' };
  }
  
  if (dayOfWeek === 0) {
    return { type: 'sunday', source: 'weekend' };
  }
  
  // 5. Default: weekday
  return { type: 'weekday' };
};

// Settings persistence
export const saveHolidaySettings = (settings: HolidaySettings): void => {
  localStorage.setItem('holiday_settings', JSON.stringify(settings));
};

export const loadHolidaySettings = (): HolidaySettings => {
  try {
    const stored = localStorage.getItem('holiday_settings');
    if (stored) {
      return { ...DEFAULT_HOLIDAY_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load holiday settings:', error);
  }
  return DEFAULT_HOLIDAY_SETTINGS;
};