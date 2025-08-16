import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

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
      const permissions = await Geolocation.requestPermissions();
      
      // Request notification permissions
      await LocalNotifications.requestPermissions();
      
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      };
      
      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }, []);

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

  // Initialize
  useEffect(() => {
    loadHomeLocation();
  }, [loadHomeLocation]);

  return {
    currentLocation,
    homeLocation,
    isAtHome,
    hasLeftHome,
    isTracking,
    setCurrentAsHome,
    saveHomeLocation,
    getCurrentPosition,
    startTracking,
    stopTracking,
    requestPermissions
  };
};