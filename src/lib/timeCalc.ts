export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  breakMinutes?: number;
  note?: string;
  type: 'travel' | 'work' | 'departure';
}

export const parseHm = (hm: string): { h: number; m: number } => {
  const [h, m] = hm.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
};

export const minutesBetween = (start: string, end: string): number => {
  const startMinutes = parseHm(start);
  const endMinutes = parseHm(end);
  
  const startTotalMinutes = startMinutes.h * 60 + startMinutes.m;
  const endTotalMinutes = endMinutes.h * 60 + endMinutes.m;
  
  if (endTotalMinutes < startTotalMinutes) {
    // Spans midnight - return 0 for now to avoid confusion
    return 0;
  }
  
  return endTotalMinutes - startTotalMinutes;
};

export const formatHm = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const formatHours = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export const applyRounding = (totalMinutes: number, roundingMinutes: number): number => {
  if (roundingMinutes <= 1) return totalMinutes;
  return Math.round(totalMinutes / roundingMinutes) * roundingMinutes;
};

export const extractTimeEntriesFromJob = (job: any): TimeEntry[] => {
  const entries: TimeEntry[] = [];
  
  // Extract from days array if available
  if (job.days && Array.isArray(job.days)) {
    job.days.forEach((day: any, index: number) => {
      const date = day.date || new Date().toISOString().split('T')[0];
      
      // Travel entry
      if (day.travelStart && day.travelEnd) {
        entries.push({
          id: `travel-${index}`,
          date,
          start: day.travelStart,
          end: day.travelEnd,
          breakMinutes: day.travelBreak || 0,
          note: 'Anreise',
          type: 'travel'
        });
      }
      
      // Work entry
      if (day.workStart && day.workEnd) {
        entries.push({
          id: `work-${index}`,
          date,
          start: day.workStart,
          end: day.workEnd,
          breakMinutes: day.workBreak || 0,
          note: 'Arbeitszeit',
          type: 'work'
        });
      }
      
      // Departure entry
      if (day.departureStart && day.departureEnd) {
        entries.push({
          id: `departure-${index}`,
          date,
          start: day.departureStart,
          end: day.departureEnd,
          breakMinutes: day.departureBreak || 0,
          note: 'Abreise',
          type: 'departure'
        });
      }
    });
  } else {
    // Extract from top-level job properties
    const baseDate = job.workStartDate || job.travelStartDate || new Date().toISOString().split('T')[0];
    
    // Travel
    if (job.travelStart && job.travelEnd) {
      entries.push({
        id: 'travel-main',
        date: job.travelStartDate || baseDate,
        start: job.travelStart,
        end: job.travelEnd,
        note: 'Anreise',
        type: 'travel'
      });
    }
    
    // Work
    if (job.workStart && job.workEnd) {
      entries.push({
        id: 'work-main',
        date: job.workStartDate || baseDate,
        start: job.workStart,
        end: job.workEnd,
        note: 'Arbeitszeit',
        type: 'work'
      });
    }
    
    // Departure
    if (job.departureStart && job.departureEnd) {
      entries.push({
        id: 'departure-main',
        date: job.departureStartDate || baseDate,
        start: job.departureStart,
        end: job.departureEnd,
        note: 'Abreise',
        type: 'departure'
      });
    }
  }
  
  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start.localeCompare(b.start);
  });
};

export const calculateTotalHoursFromEntries = (entries: TimeEntry[]): { totalMinutes: number; totalBreakMinutes: number } => {
  let totalMinutes = 0;
  let totalBreakMinutes = 0;
  
  entries.forEach(entry => {
    const workMinutes = minutesBetween(entry.start, entry.end);
    const breakMinutes = entry.breakMinutes || 0;
    
    totalMinutes += Math.max(0, workMinutes - breakMinutes);
    totalBreakMinutes += breakMinutes;
  });
  
  return { totalMinutes, totalBreakMinutes };
};