export interface OvertimeSettings {
  timeSlots: {
    id: string;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    rate: number;  // Percentage (50 for 50%, 100 for 100%)
    name: string;  // Display name
  }[];
  weekendRate: number; // Weekend rate (100 for 100%)
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
  regularHours: number;
  overtimeSlots: {
    slotId: string;
    name: string;
    hours: number;
    rate: number;
    amount: number;
    isWeekend?: boolean;
  }[];
  weekendHours: number;
  totalOvertime: number;
  totalAmount: number;
}

export const DEFAULT_OVERTIME_SETTINGS: OvertimeSettings = {
  timeSlots: [
    {
      id: '1',
      start: '16:00',
      end: '18:00',
      rate: 50,
      name: 'Abend 16-18 Uhr'
    },
    {
      id: '2', 
      start: '18:00',
      end: '00:00',
      rate: 100,
      name: 'Nacht 18-0 Uhr'
    },
    {
      id: '3',
      start: '00:00', 
      end: '06:00',
      rate: 100,
      name: 'Nacht 0-6 Uhr'
    },
    {
      id: '4',
      start: '06:00',
      end: '08:00', 
      rate: 50,
      name: 'Früh 6-8 Uhr'
    }
  ],
  weekendRate: 100,
  weekendEnabled: true
};