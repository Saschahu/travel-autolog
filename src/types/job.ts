export interface DayData {
  date?: string; // ISO (yyyy-mm-dd)
  travelStart?: string; travelEnd?: string;
  workStart?: string;   workEnd?: string;
  departureStart?: string; departureEnd?: string;
  notes?: string;
}
export interface Job {
  id: string;
  days?: DayData[];
}
