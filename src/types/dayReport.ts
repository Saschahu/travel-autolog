export interface DayReport {
  dayIndex: number;      // 0-based
  dateISO?: string;      // 'YYYY-MM-DD' (when available from time entries)
  text: string;          // Report content for this day
}