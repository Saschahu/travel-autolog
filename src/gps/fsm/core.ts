import { LocationData, GPSState, GPSEventType, GPSEvent } from '@/types/gps-events';

// Re-export the types for convenience
export type { LocationData, GPSState, GPSEventType, GPSEvent };

// FSM Configuration interface
export interface FsmConfig {
  distanceThresholdMeters: number; // stationaryDistance threshold
  dwellMs: number; // stationaryTime in milliseconds
  noFixTimeoutMs: number; // timeout for missing GPS data
  movingSpeedMs: number; // moving speed threshold in m/s
  movingDistanceMeters: number; // moving distance threshold
  movingTimeWindowMs: number; // moving time window in milliseconds
  homeRadiusMeters: number; // home geofence radius
  homeLatitude: number | null;
  homeLongitude: number | null;
}

// Time source interface for dependency injection
export interface TimeSource {
  now(): number; // Returns current timestamp in milliseconds
}

// Event emitter interface
export interface Emitter {
  emit(event: GPSEvent): void;
}

// Pure FSM state
interface FsmState {
  currentState: GPSState;
  locationHistory: LocationData[];
  stationaryStartTime?: number;
  lastLocation?: LocationData;
}

// Pure FSM implementation
export function createGpsFsm(
  config: FsmConfig,
  deps: { time: TimeSource; emit?: Emitter }
): {
  getState(): GPSState;
  dispatch(event: { type: 'LOCATION_UPDATE'; location: LocationData }): void;
  dispatch(event: { type: 'SELECT_WORK' }): void;
  dispatch(event: { type: 'SELECT_PRIVATE' }): void;
  dispatch(event: { type: 'CONFIRM_AT_CUSTOMER' }): void;
  dispatch(event: { type: 'DENY_AT_CUSTOMER' }): void;
  dispatch(event: { type: 'CONFIRM_WORK_DONE' }): void;
  dispatch(event: { type: 'DENY_WORK_DONE' }): void;
  dispatch(event: { type: 'CONFIRM_HOME_ARRIVAL' }): void;
} {
  const state: FsmState = {
    currentState: 'idle_at_home',
    locationHistory: [],
    stationaryStartTime: undefined,
    lastLocation: undefined,
  };

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  function isLocationAtHome(location: LocationData): boolean {
    if (!config.homeLatitude || !config.homeLongitude) {
      return false;
    }

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      config.homeLatitude,
      config.homeLongitude
    );

    return distance <= config.homeRadiusMeters;
  }

  function isLocationMoving(location: LocationData): boolean {
    // Check by speed if available
    if (location.speed !== null && location.speed >= config.movingSpeedMs) {
      return true;
    }

    // Check by distance over time window
    if (state.locationHistory.length >= 2) {
      const cutoffTime = location.timestamp.getTime() - config.movingTimeWindowMs;
      
      const recentLocations = state.locationHistory.filter(
        loc => loc.timestamp.getTime() >= cutoffTime
      );

      if (recentLocations.length >= 2) {
        const oldestRecent = recentLocations[0];
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          oldestRecent.latitude,
          oldestRecent.longitude
        );

        return distance >= config.movingDistanceMeters;
      }
    }

    return false;
  }

  function isLocationStationary(): boolean {
    if (state.locationHistory.length < 3) {
      return false;
    }

    const now = deps.time.now();

    // Check if current conditions suggest stationary
    const recent = state.locationHistory.slice(-5); // Last 5 locations
    if (recent.length < 2) return false;

    const allSlowSpeeds = recent.every(loc => 
      loc.speed === null || loc.speed < config.movingSpeedMs
    );

    if (!allSlowSpeeds) {
      state.stationaryStartTime = undefined; // Reset timer if moving
      return false;
    }

    // Check if positions are close together
    const maxDistance = Math.max(
      ...recent.slice(1).map(loc => 
        calculateDistance(
          recent[0].latitude,
          recent[0].longitude,
          loc.latitude,
          loc.longitude
        )
      )
    );

    if (maxDistance >= config.distanceThresholdMeters) {
      state.stationaryStartTime = undefined; // Reset timer if too spread out
      return false;
    }

    // Start timing if not already started
    if (!state.stationaryStartTime) {
      state.stationaryStartTime = now;
      return false; // Not stationary yet, just started timing
    }

    // Check if we've been stationary long enough
    const stationaryDuration = now - state.stationaryStartTime;
    return stationaryDuration >= config.dwellMs;
  }

  function transitionTo(newState: GPSState): void {
    state.currentState = newState;
    state.stationaryStartTime = undefined; // Reset stationary timer
    
    // Clear location history when changing states to avoid interference
    if (newState === 'en_route_to_customer' || newState === 'en_route_home') {
      state.locationHistory = [];
    }
  }

  function triggerEvent(type: GPSEventType, location: LocationData, note?: string): void {
    if (!deps.emit) return;

    const event: GPSEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(deps.time.now()),
      type,
      location,
      note
    };
    
    deps.emit.emit(event);
  }

  function checkStateTransitions(location: LocationData): void {
    const isAtHome = isLocationAtHome(location);
    const isMoving = isLocationMoving(location);
    const isStationary = isLocationStationary();

    switch (state.currentState) {
      case 'idle_at_home':
        if (!isAtHome && isMoving) {
          transitionTo('departing');
          triggerEvent('HOME_LEAVE', location, 'Home-Geofence verlassen');
        }
        break;

      case 'departing':
        // This state is mainly for user confirmation (work/private)
        // Will transition based on user choice
        break;

      case 'en_route_to_customer':
        if (isStationary && !isAtHome) {
          transitionTo('stationary_check');
          triggerEvent('ARRIVAL_CANDIDATE', location, 'Stationär erkannt - beim Kunden?');
        }
        break;

      case 'stationary_check':
        if (isMoving) {
          // Movement detected, go back to en route
          transitionTo('en_route_to_customer');
        }
        // Actual transition to at_customer happens via user confirmation
        break;

      case 'at_customer':
        if (isMoving) {
          transitionTo('leaving_customer');
          triggerEvent('AT_CUSTOMER_END', location, 'Bewegung erkannt - Arbeit fertig?');
        }
        break;

      case 'leaving_customer':
        // This state is for user confirmation (work done?)
        // Will transition based on user choice
        break;

      case 'en_route_home':
        if (isAtHome && isStationary) {
          transitionTo('stationary_home_check');
          triggerEvent('HOME_ARRIVAL_CONFIRMED', location, 'Zuhause angekommen - Heimreise beendet?');
        }
        break;

      case 'stationary_home_check':
        if (!isAtHome || isMoving) {
          // Left home again or moving, go back to en route
          transitionTo('en_route_home');
        }
        // Actual transition to done happens via user confirmation
        break;

      case 'done':
        // Session completed, reset to idle_at_home
        if (isAtHome) {
          transitionTo('idle_at_home');
        }
        break;
    }
  }

  return {
    getState(): GPSState {
      return state.currentState;
    },

    dispatch(event: any): void {
      switch (event.type) {
        case 'LOCATION_UPDATE':
          // Store location in history (keep rolling window)
          state.locationHistory.push(event.location);
          const maxHistorySize = Math.ceil(config.dwellMs / (5 * 1000)); // Assume 5 second sampling
          if (state.locationHistory.length > maxHistorySize) {
            state.locationHistory.shift();
          }

          state.lastLocation = event.location;
          checkStateTransitions(event.location);
          break;

        case 'SELECT_WORK':
          if (state.currentState === 'departing') {
            transitionTo('en_route_to_customer');
            if (state.lastLocation) {
              triggerEvent('WORK_SELECTED', state.lastLocation, 'Arbeit ausgewählt - Anreise gestartet');
            }
          }
          break;

        case 'SELECT_PRIVATE':
          if (state.currentState === 'departing') {
            transitionTo('idle_at_home');
            if (state.lastLocation) {
              triggerEvent('PRIVATE_SELECTED', state.lastLocation, 'Privat ausgewählt');
            }
          }
          break;

        case 'CONFIRM_AT_CUSTOMER':
          if (state.currentState === 'stationary_check') {
            transitionTo('at_customer');
            if (state.lastLocation) {
              triggerEvent('AT_CUSTOMER_START', state.lastLocation, 'Beim Kunden angekommen - Arbeitszeit gestartet');
            }
          }
          break;

        case 'DENY_AT_CUSTOMER':
          if (state.currentState === 'stationary_check') {
            transitionTo('en_route_to_customer');
          }
          break;

        case 'CONFIRM_WORK_DONE':
          if (state.currentState === 'leaving_customer') {
            transitionTo('en_route_home');
            if (state.lastLocation) {
              triggerEvent('WORK_DONE', state.lastLocation, 'Arbeit abgeschlossen - Heimreise gestartet');
            }
          }
          break;

        case 'DENY_WORK_DONE':
          if (state.currentState === 'leaving_customer') {
            transitionTo('at_customer');
          }
          break;

        case 'CONFIRM_HOME_ARRIVAL':
          if (state.currentState === 'stationary_home_check') {
            transitionTo('done');
          }
          break;
      }
    }
  };
}