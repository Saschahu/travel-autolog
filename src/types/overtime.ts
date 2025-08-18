export interface OvertimeSettings {
  timeSlots: {
    id: string;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    rate: number;  // Percentage (50 for 50%, 100 for 100%)
    name: string;  // Display name
  }[];
}

export interface TimeSlot {
  start: string;
  end: string;
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
  }[];
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
  ]
};