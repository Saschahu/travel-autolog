// Finite State Machine States
export type GPSState = 
  | 'idle_at_home'
  | 'departing'
  | 'en_route_to_customer'
  | 'stationary_check'
  | 'at_customer'
  | 'leaving_customer'
  | 'en_route_home'
  | 'stationary_home_check'
  | 'done';

// GPS Events
export type GPSEventType =
  | 'HOME_LEAVE'
  | 'WORK_SELECTED'
  | 'PRIVATE_SELECTED'
  | 'ARRIVAL_CANDIDATE'
  | 'AT_CUSTOMER_START'
  | 'AT_CUSTOMER_END'
  | 'WORK_DONE'
  | 'HOME_ARRIVAL_CONFIRMED';

// Location data structure
export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
  speed: number | null;
  heading: number | null;
}

// GPS Event structure
export interface GPSEvent {
  id: string;
  timestamp: Date;
  type: GPSEventType;
  location: LocationData;
  note?: string;
  customer?: string;
}

// GPS Session structure
export interface GPSSession {
  id: string;
  date: string; // YYYY-MM-DD
  events: GPSEvent[];
  totals: {
    travelTime: number; // minutes
    workTime: number; // minutes
    returnTime: number; // minutes
  };
  startTimestamp?: Date;
  endTimestamp?: Date;
}