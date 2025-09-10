import { useState, useEffect, useCallback } from 'react';

// Check if we're running in a web browser or mobile app
const isWeb = typeof window !== 'undefined' && !window.hasOwnProperty('Capacitor');

// Fallback implementations for web
const WebGeolocation = {
  checkPermissions: async () => {
    try {
      const result = await navigator.permissions.query({name: 'geolocation'});
      return { location: result.state === 'granted' ? 'granted' : 'denied' };
    } catch {
      return { location: 'granted' }; // Assume granted for compatibility
    }
  },
  requestPermissions: async () => {
    try {
      const result = await navigator.permissions.query({name: 'geolocation'});
      return { location: result.state === 'granted' ? 'granted' : 'denied' };
    } catch {
      return { location: 'granted' }; // Assume granted for compatibility
    }
  },
  getCurrentPosition: (options: any) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: options.enableHighAccuracy,
          timeout: options.timeout,
          maximumAge: options.maximumAge
        }
      );
    });
  },
  watchPosition: (options: any, callback: any) => {
    if (!navigator.geolocation) {
      callback(null, new Error('Geolocation is not supported by this browser.'));
      return 'web_watch_id';
    }
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          },
          timestamp: position.timestamp
        }, null);
      },
      (error) => callback(null, error),
      {
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge
      }
    );
    
    return Promise.resolve(`web_${watchId}`);
  },
  clearWatch: async (options: any) => {
    const watchId = options.id.replace('web_', '');
    if (navigator.geolocation && !isNaN(parseInt(watchId))) {
      navigator.geolocation.clearWatch(parseInt(watchId));
    }
  }
};

const WebLocalNotifications = {
  requestPermissions: async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return { display: permission };
      }
      return { display: 'denied' };
    } catch {
      return { display: 'denied' };
    }
  },
  schedule: async (options: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = options.notifications[0];
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        tag: notification.id.toString()
      });
    }
  }
};

const WebPreferences = {
  get: async (options: any) => {
    try {
      const value = localStorage.getItem(options.key);
      return { value };
    } catch {
      return { value: null };
    }
  },
  set: async (options: any) => {
    try {
      localStorage.setItem(options.key, options.value);
    } catch (error) {
      console.error('Error setting preference:', error);
    }
  }
};

// Use appropriate APIs based on environment
let Geolocation: any, LocalNotifications: any, Preferences: any;

if (isWeb) {
  Geolocation = WebGeolocation;
  LocalNotifications = WebLocalNotifications;
  Preferences = WebPreferences;
} else {
  // Import Capacitor APIs only when not in web environment
  try {
    const CapacitorGeolocation = require('@capacitor/geolocation').Geolocation;
    const CapacitorLocalNotifications = require('@capacitor/local-notifications').LocalNotifications;
    const CapacitorPreferences = require('@capacitor/preferences').Preferences;
    
    Geolocation = CapacitorGeolocation;
    LocalNotifications = CapacitorLocalNotifications;
    Preferences = CapacitorPreferences;
  } catch {
    // Fallback to web implementations if Capacitor imports fail
    Geolocation = WebGeolocation;
    LocalNotifications = WebLocalNotifications;
    Preferences = WebPreferences;
  }
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface HomeLocation {
  latitude: number;
  longitude: number;
  radius: number; // meters
}

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [isAtHome, setIsAtHome] = useState(true);
  const [hasLeftHome, setHasLeftHome] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  // Throttle/suppress repeated IP lookups to avoid noisy DNS errors
  const [lastIpAttemptAt, setLastIpAttemptAt] = useState<number | null>(null);
  const [ipAttemptCount, setIpAttemptCount] = useState(0);

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Load home location from preferences
  const loadHomeLocation = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'homeLocation' });
      if (value) {
        setHomeLocation(JSON.parse(value));
      }
    } catch (error) {
      console.error('Error loading home location:', error);
    }
  }, []);

  // Save home location to preferences
  const saveHomeLocation = useCallback(async (location: HomeLocation) => {
    try {
      await Preferences.set({
        key: 'homeLocation',
        value: JSON.stringify(location)
      });
      setHomeLocation(location);
    } catch (error) {
      console.error('Error saving home location:', error);
    }
  }, []);

  // Set current location as home
  const setCurrentAsHome = useCallback(async (radius: number = 100) => {
    if (currentLocation) {
      const homeLocation: HomeLocation = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius: radius
      };
      await saveHomeLocation(homeLocation);
    }
  }, [currentLocation, saveHomeLocation]);

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    try {
      setError(null);
      const permissions = await Geolocation.requestPermissions();
      
      // Request notification permissions
      await LocalNotifications.requestPermissions();
      
      const granted = permissions.location === 'granted';
      setHasPermissions(granted);
      
      if (!granted) {
        setError('GPS-Berechtigung wurde verweigert. Bitte erlaube den Standortzugriff in den Browser-Einstellungen.');
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setError('Fehler beim Anfordern der GPS-Berechtigung: ' + error.message);
      setHasPermissions(false);
      return false;
    }
  }, []);

// Get current position via IP address (robust with multiple providers)
  const getLocationFromIP = useCallback(async (): Promise<LocationData | null> => {
    // Throttle: only attempt once per session and not more often than every 10 minutes
    if (ipAttemptCount >= 1) {
      return null;
    }
    if (lastIpAttemptAt && Date.now() - lastIpAttemptAt < 10 * 60 * 1000) {
      return null;
    }
    setLastIpAttemptAt(Date.now());
    setIpAttemptCount(c => c + 1);

    setError('Position über IP wird abgerufen...');

    const withTimeout = async (url: string, ms = 5000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { signal: controller.signal, credentials: 'omit', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } finally {
        clearTimeout(id);
      }
    };

    // Try providers with permissive CORS first
    try {
      // 1) ipwho.is
      const data1 = await withTimeout('https://ipwho.is/');
      if (data1 && data1.success && typeof data1.latitude === 'number' && typeof data1.longitude === 'number') {
        const locationData: LocationData = {
          latitude: data1.latitude,
          longitude: data1.longitude,
          timestamp: Date.now()
        };
        setCurrentLocation(locationData);
        setError('Position über IP erfolgreich abgerufen!');
        return locationData;
      }
    } catch (e) {
      console.debug('IP provider ipwho.is failed');
    }

    try {
      // 2) ipapi.co
      const data2 = await withTimeout('https://ipapi.co/json/');
      if (data2 && typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
        const locationData: LocationData = {
          latitude: data2.latitude,
          longitude: data2.longitude,
          timestamp: Date.now()
        };
        setCurrentLocation(locationData);
        setError('Position über IP erfolgreich abgerufen!');
        return locationData;
      }
    } catch (e) {
      console.debug('IP provider ipapi.co failed');
    }

    try {
      // 3) geolocation-db.com
      const data3 = await withTimeout('https://geolocation-db.com/json/');
      if (data3 && typeof data3.latitude === 'number' && typeof data3.longitude === 'number') {
        const locationData: LocationData = {
          latitude: data3.latitude,
          longitude: data3.longitude,
          timestamp: Date.now()
        };
        setCurrentLocation(locationData);
        setError('Position über IP erfolgreich abgerufen!');
        return locationData;
      }
    } catch (e) {
      console.debug('IP provider geolocation-db.com failed');
    }

    setError('Fehler beim Abrufen der IP-Position.');
    return null;
  }, [ipAttemptCount, lastIpAttemptAt]);

  // Get current position (GPS with IP fallback)
  const getCurrentPosition = useCallback(async (useIPFallback: boolean = false) => {
    if (useIPFallback) {
      return await getLocationFromIP();
    }

    try {
      setError(null);
      console.log('Getting current position...');
      setError('GPS wird abgerufen...');
      
      // Check if we have permissions first
      console.log('Checking permissions...');
      const permissions = await Geolocation.checkPermissions();
      console.log('Current permissions:', permissions);
      
      if (permissions.location !== 'granted') {
        console.log('No permissions, requesting...');
        const granted = await requestPermissions();
        if (!granted) {
          setError('GPS-Berechtigung wurde verweigert. Versuche IP-Standort...');
          return await getLocationFromIP();
        }
      }
      
      console.log('Getting position with high accuracy...');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000
      });
      
      console.log('Position received:', position);
      setError('Position erfolgreich abgerufen!');
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      };
      
      setCurrentLocation(locationData);
      setHasPermissions(true);
      return locationData;
    } catch (error) {
      console.error('Error getting current position:', error);
      let errorMessage = 'Fehler beim Abrufen der Position: ';
      
      if (error.code === 1) {
        errorMessage += 'GPS-Berechtigung verweigert.';
      } else if (error.code === 2) {
        errorMessage += 'Position nicht verfügbar.';
      } else if (error.code === 3) {
        errorMessage += 'Zeitüberschreitung.';
      } else {
        errorMessage += error.message || 'Unbekannter Fehler';
      }
      
      setError(errorMessage + ' Versuche IP-Standort...');
      return await getLocationFromIP();
    }
  }, [getLocationFromIP, requestPermissions]);

  // Check if user is at home
  const checkIfAtHome = useCallback((location: LocationData, home: HomeLocation): boolean => {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      home.latitude,
      home.longitude
    );
    return distance <= home.radius;
  }, []);

  // Start location tracking
  const startTracking = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.error('Location permission denied');
      return false;
    }

    try {
      setIsTracking(true);
      
      // Watch position changes
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        },
        (position, error) => {
          if (error) {
            console.error('Location watch error:', error);
            return;
          }
          
          if (position) {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp
            };
            
            setCurrentLocation(locationData);
            
            // Check home status if home location is set
            if (homeLocation) {
              const atHome = checkIfAtHome(locationData, homeLocation);
              
              // Detect leaving home
              if (isAtHome && !atHome && !hasLeftHome) {
                setHasLeftHome(true);
                triggerLeavingHomeNotification();
              }
              
              setIsAtHome(atHome);
              
              // Reset hasLeftHome when returning home
              if (atHome && hasLeftHome) {
                setHasLeftHome(false);
              }
            }
          }
        }
      );
      
      return watchId;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsTracking(false);
      return null;
    }
  }, [homeLocation, isAtHome, hasLeftHome, checkIfAtHome, requestPermissions]);

  // Stop location tracking
  const stopTracking = useCallback(async (watchId?: string) => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
    }
    setIsTracking(false);
  }, []);

  // Trigger notification when leaving home
  const triggerLeavingHomeNotification = useCallback(async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Standort verlassen',
            body: 'Du hast dein Zuhause verlassen. Arbeit oder privat?',
            id: 1,
            sound: 'default',
            actionTypeId: 'LEAVING_HOME',
            extra: {
              action: 'leaving_home'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, []);

  // Initialize permissions check
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (isWeb && navigator.permissions) {
          const result = await navigator.permissions.query({name: 'geolocation'});
          setHasPermissions(result.state === 'granted');
        }
      } catch (error) {
        console.log('Could not check permissions:', error);
      }
    };
    
    loadHomeLocation();
    checkPermissions();
  }, [loadHomeLocation]);

  return {
    currentLocation,
    homeLocation,
    isAtHome,
    hasLeftHome,
    isTracking,
    error,
    hasPermissions,
    setCurrentAsHome,
    saveHomeLocation,
    getCurrentPosition,
    getLocationFromIP,
    startTracking,
    stopTracking,
    requestPermissions
  };
};