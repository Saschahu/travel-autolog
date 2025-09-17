// GPS Finite State Machine Core Implementation

export type GpsState =
  | 'idle_at_home'
  | 'departing'
  | 'en_route_to_customer'
  | 'stationary_check'
  | 'at_customer'
  | 'leaving_customer'
  | 'en_route_home'
  | 'stationary_home_check'
  | 'done';

export type GpsEvent =
  | { type: 'GPS_FIX'; lat: number; lng: number; speed?: number; ts: number }
  | { type: 'NO_FIX'; ts: number }
  | { type: 'USER_CONFIRM'; action: 'ARRIVED' | 'LEFT' | 'HOME'; ts: number };

export interface TimeSource { 
  now(): number;
}

export interface Emitter { 
  emit: (e: { type: string; [k: string]: unknown }) => void;
}

export interface FsmConfig {
  homeRadius: number;
  customerRadius: number;
  stationaryTimeout: number;
}

export interface Fsm {
  getState(): GpsState;
  dispatch(evt: GpsEvent): void;
}

export function createGpsFsm(
  config: FsmConfig, 
  deps: { time: TimeSource; emit?: Emitter }
): Fsm {
  const currentState: GpsState = 'idle_at_home';
  
  return {
    getState(): GpsState {
      return currentState;
    },
    
    dispatch(evt: GpsEvent): void {
      // Minimal implementation for linting purposes
      deps.emit?.({ type: 'state_change', state: currentState, event: evt });
    }
  };
}