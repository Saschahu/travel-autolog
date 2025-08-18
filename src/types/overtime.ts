export interface OvertimeSettings {
  guaranteedHours: number; // Guaranteed minimum hours per day (e.g., 8)
  overtimeThreshold1: number; // First overtime threshold (e.g., 8 hours)
  overtimeThreshold2: number; // Second overtime threshold (e.g., 12 hours)
  overtimeRate1: number; // Rate for 8-12 hours (50 for 50%)
  overtimeRate2: number; // Rate for over 12 hours (100 for 100%)
  saturdayRate: number; // Saturday rate (50 for 50%)
  sundayRate: number; // Sunday/holiday rate (100 for 100%)
  weekendEnabled: boolean; // Whether weekend rates are enabled
}

export interface TimeSlot {
  start: string;
  end: string;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  duration: number; // in minutes
}

export interface OvertimeCalculation {
  guaranteedHours: number; // Always 8 hours minimum
  actualWorkedHours: number; // Actually worked time
  regularHours: number; // Hours up to 8
  overtime1Hours: number; // Hours from 8-12 (50%)
  overtime2Hours: number; // Hours over 12 (100%)
  saturdayHours: number; // Saturday hours
  sundayHours: number; // Sunday/holiday hours
  overtimeBreakdown: {
    type: string;
    hours: number;
    rate: number;
    amount: number;
  }[];
  totalOvertimeHours: number;
  totalOvertimeAmount: number;
  totalPayableHours: number; // guaranteed + overtime amounts
}

export const DEFAULT_OVERTIME_SETTINGS: OvertimeSettings = {
  guaranteedHours: 8,
  overtimeThreshold1: 8,
  overtimeThreshold2: 12,
  overtimeRate1: 50, // 8-12 hours = 50%
  overtimeRate2: 100, // Over 12 hours = 100%
  saturdayRate: 50, // Saturday = 50%
  sundayRate: 100, // Sunday/holidays = 100%
  weekendEnabled: true
};