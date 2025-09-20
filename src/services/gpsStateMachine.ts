import type { GPSSettings } from '@/types/gps';
import type { LocationData, GPSState, GPSEventType, GPSEvent } from '@/types/gps-events';

export class GPSStateMachine {
  private currentState: GPSState = 'idle_at_home';
  private settings: GPSSettings;
  private onStateChange?: (state: GPSState) => void;
  private onEventTrigger?: (event: GPSEvent) => void;
  private lastLocation?: LocationData;
  private locationHistory: LocationData[] = [];
  private stationaryStartTime?: Date;
  
  constructor(
    settings: GPSSettings,
    onStateChange?: (state: GPSState) => void,
    onEventTrigger?: (event: GPSEvent) => void
  ) {
    this.settings = settings;
    this.onStateChange = onStateChange;
    this.onEventTrigger = onEventTrigger;
  }

  public getCurrentState(): GPSState {
    return this.currentState;
  }

  public updateSettings(settings: GPSSettings): void {
    this.settings = settings;
  }

  public processLocationUpdate(location: LocationData): void {
    // Store location in history (keep rolling window)
    this.locationHistory.push(location);
    const maxHistorySize = Math.ceil(this.settings.thresholds.stationaryTime / (this.settings.capture.samplingInterval / 60));
    if (this.locationHistory.length > maxHistorySize) {
      this.locationHistory.shift();
    }

    this.lastLocation = location;
    this.checkStateTransitions(location);
  }

  private checkStateTransitions(location: LocationData): void {
    const isAtHome = this.isLocationAtHome(location);
    const isMoving = this.isLocationMoving(location);
    const isStationary = this.isLocationStationary();

    switch (this.currentState) {
      case 'idle_at_home':
        if (!isAtHome && isMoving) {
          this.transitionTo('departing');
          this.triggerEvent('HOME_LEAVE', location, 'Home-Geofence verlassen');
        }
        break;

      case 'departing':
        // This state is mainly for user confirmation (work/private)
        // Will transition based on user choice
        break;

      case 'en_route_to_customer':
        if (isStationary && !isAtHome) {
          this.transitionTo('stationary_check');
          this.triggerEvent('ARRIVAL_CANDIDATE', location, 'Stationär erkannt - beim Kunden?');
        }
        break;

      case 'stationary_check':
        if (isMoving) {
          // Movement detected, go back to en route
          this.transitionTo('en_route_to_customer');
        }
        // Actual transition to at_customer happens via user confirmation
        break;

      case 'at_customer':
        if (isMoving) {
          this.transitionTo('leaving_customer');
          this.triggerEvent('AT_CUSTOMER_END', location, 'Bewegung erkannt - Arbeit fertig?');
        }
        break;

      case 'leaving_customer':
        // This state is for user confirmation (work done?)
        // Will transition based on user choice
        break;

      case 'en_route_home':
        if (isAtHome && isStationary) {
          this.transitionTo('stationary_home_check');
          this.triggerEvent('HOME_ARRIVAL_CONFIRMED', location, 'Zuhause angekommen - Heimreise beendet?');
        }
        break;

      case 'stationary_home_check':
        if (!isAtHome || isMoving) {
          // Left home again or moving, go back to en route
          this.transitionTo('en_route_home');
        }
        // Actual transition to done happens via user confirmation
        break;

      case 'done':
        // Session completed, reset to idle_at_home
        if (isAtHome) {
          this.transitionTo('idle_at_home');
        }
        break;
    }
  }

  // User action methods (for notification responses)
  public selectWork(): void {
    if (this.currentState === 'departing') {
      this.transitionTo('en_route_to_customer');
      this.triggerEvent('WORK_SELECTED', this.lastLocation!, 'Arbeit ausgewählt - Anreise gestartet');
    }
  }

  public selectPrivate(): void {
    if (this.currentState === 'departing') {
      this.transitionTo('idle_at_home');
      this.triggerEvent('PRIVATE_SELECTED', this.lastLocation!, 'Privat ausgewählt');
    }
  }

  public confirmAtCustomer(): void {
    if (this.currentState === 'stationary_check') {
      this.transitionTo('at_customer');
      this.triggerEvent('AT_CUSTOMER_START', this.lastLocation!, 'Beim Kunden angekommen - Arbeitszeit gestartet');
    }
  }

  public denyAtCustomer(): void {
    if (this.currentState === 'stationary_check') {
      this.transitionTo('en_route_to_customer');
    }
  }

  public confirmWorkDone(): void {
    if (this.currentState === 'leaving_customer') {
      this.transitionTo('en_route_home');
      this.triggerEvent('WORK_DONE', this.lastLocation!, 'Arbeit abgeschlossen - Heimreise gestartet');
    }
  }

  public denyWorkDone(): void {
    if (this.currentState === 'leaving_customer') {
      this.transitionTo('at_customer');
    }
  }

  public confirmHomeArrival(): void {
    if (this.currentState === 'stationary_home_check') {
      this.transitionTo('done');
    }
  }

  private transitionTo(newState: GPSState): void {
    console.log(`GPS State transition: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
    this.stationaryStartTime = undefined; // Reset stationary timer
    this.onStateChange?.(newState);
  }

  private triggerEvent(type: GPSEventType, location: LocationData, note?: string): void {
    const event: GPSEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      location,
      note
    };
    
    console.log('GPS Event triggered:', event);
    this.onEventTrigger?.(event);
  }

  private isLocationAtHome(location: LocationData): boolean {
    if (!this.settings.homeLocation.latitude || !this.settings.homeLocation.longitude) {
      return false;
    }

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      this.settings.homeLocation.latitude,
      this.settings.homeLocation.longitude
    );

    return distance <= this.settings.homeLocation.radius;
  }

  private isLocationMoving(location: LocationData): boolean {
    // Check by speed if available
    if (location.speed !== null && location.speed >= this.settings.thresholds.movingSpeed) {
      return true;
    }

    // Check by distance over time window
    if (this.locationHistory.length >= 2) {
      const timeWindow = this.settings.thresholds.movingTimeWindow * 60 * 1000; // ms
      const cutoffTime = new Date(location.timestamp.getTime() - timeWindow);
      
      const recentLocations = this.locationHistory.filter(
        loc => loc.timestamp >= cutoffTime
      );

      if (recentLocations.length >= 2) {
        const oldestRecent = recentLocations[0];
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          oldestRecent.latitude,
          oldestRecent.longitude
        );

        return distance >= this.settings.thresholds.movingDistance;
      }
    }

    return false;
  }

  private isLocationStationary(): boolean {
    if (this.locationHistory.length < 2) {
      return false;
    }

    const now = new Date();
    const stationaryThreshold = this.settings.thresholds.stationaryTime * 60 * 1000; // ms

    // Check if we've been in this state long enough
    if (!this.stationaryStartTime) {
      // Check if current conditions suggest stationary
      const recent = this.locationHistory.slice(-5); // Last 5 locations
      if (recent.length < 2) return false;

      const allSlowSpeeds = recent.every(loc => 
        loc.speed === null || loc.speed < this.settings.thresholds.stationarySpeed
      );

      if (allSlowSpeeds) {
        // Check if positions are close together
        const maxDistance = Math.max(
          ...recent.slice(1).map(loc => 
            this.calculateDistance(
              recent[0].latitude,
              recent[0].longitude,
              loc.latitude,
              loc.longitude
            )
          )
        );

        if (maxDistance < this.settings.thresholds.stationaryDistance) {
          this.stationaryStartTime = now;
          return false; // Not stationary yet, just started timing
        }
      }
      return false;
    }

    // Check if we've been stationary long enough
    const stationaryDuration = now.getTime() - this.stationaryStartTime.getTime();
    return stationaryDuration >= stationaryThreshold;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}
