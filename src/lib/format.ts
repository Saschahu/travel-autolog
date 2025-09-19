// Locale formatters for reports

const dfLocales: Record<string, () => Promise<any>> = {
  de: () => import('date-fns/locale/de'),
  en: () => import('date-fns/locale/en-GB'),
  nb: () => import('date-fns/locale/nb'),
  sv: () => import('date-fns/locale/sv'),
  da: () => import('date-fns/locale/da'),
};

export async function formatDateA4(d: Date, lang: string): Promise<string> {
  try {
    const localeModule = await (dfLocales[lang] ?? dfLocales.en)();
    const locale = localeModule.default || localeModule;
    const { format } = await import('date-fns/format');
    return format(d, 'P', { locale }); // Locale-specific short date format
  } catch (error) {
    console.warn('Failed to format date with locale', lang, error);
    return d.toLocaleDateString(); // Fallback
  }
}

export async function formatTimeA4(timeStr: string, lang: string): Promise<string> {
  try {
    if (!timeStr) return '';
    // Time strings are already in HH:MM format, no locale-specific formatting needed
    return timeStr;
  } catch (error) {
    return timeStr;
  }
}

export function formatHmLocalized(min: number, t: (key: string) => string): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}${t('hoursShort')} ${m}${t('minutesShort')}`;
}

export function formatDecimalHours(hours: number): string {
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// Simple hours:minutes formatter 
export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}