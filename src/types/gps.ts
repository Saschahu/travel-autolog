export interface GPSSettings {
  // Home Location
  homeLocation: {
    latitude: number | null;
    longitude: number | null;
    radius: number; // meters
  };
  
  // Movement Thresholds
  thresholds: {
    movingSpeed: number; // m/s
    movingDistance: number; // meters in time window
    movingTimeWindow: number; // minutes
    stationarySpeed: number; // m/s
    stationaryTime: number; // minutes
    stationaryDistance: number; // meters
  };
  
  // Notifications
  notifications: {
    enabled: boolean;
    sound: boolean;
    actions: boolean;
  };
  
  // Data Capture
  capture: {
    accuracyThreshold: number; // meters
    samplingInterval: number; // seconds
  };
  
  // Mapbox
  mapbox: {
    styleId: string;
    minZoom: number;
    maxZoom: number;
    markerStyle: 'default' | 'custom';
  };
  
  // System
  enabled: boolean;
  backgroundMode: boolean; // for Capacitor
}

export const defaultGPSSettings: GPSSettings = {
  homeLocation: {
    latitude: null,
    longitude: null,
    radius: 100
  },
  thresholds: {
    movingSpeed: 1.5,
    movingDistance: 150,
    movingTimeWindow: 2,
    stationarySpeed: 0.5,
    stationaryTime: 10,
    stationaryDistance: 50
  },
  notifications: {
    enabled: true,
    sound: true,
    actions: true
  },
  capture: {
    accuracyThreshold: 50,
    samplingInterval: 5
  },
  mapbox: {
    styleId: 'mapbox://styles/mapbox/streets-v12',
    minZoom: 5,
    maxZoom: 20,
    markerStyle: 'default'
  },
  enabled: false,
  backgroundMode: false
};