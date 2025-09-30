// Manual trip input types
export type VehicleType = 'benzin' | 'diesel' | 'ev' | 'phev';
export type VehicleSize = 1 | 2 | 3 | 4;

export interface TripInput {
  fromAddress: string;
  toAddress: string;
  dateYmd: string;      // YYYY-MM-DD
  timeHm: string;       // HH:MM
  vehicle: {
    type: VehicleType;
    size: VehicleSize;
    length?: string;    // optional length in meters
  };
}

export interface TripSegment {
  name: string;
  nok: number;
}

export interface TripQuote {
  meters: number;
  tollNok: number;
  tollAutopassNok?: number;
  segments?: TripSegment[];
}

export interface TripDraft extends TripInput {
  id: string;
  quote?: TripQuote;
  createdAt: Date;
}
