import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationData, GPSState, GPSEvent, GPSSession } from '@/types/gps-events';
import { GPSSettings, defaultGPSSettings } from '@/types/gps';
import { GPSStateMachine } from '@/services/gpsStateMachine';
import { GeolocationService } from '@/services/geolocationService';
import { GPSSessionCalculator, SessionTimers } from '@/services/gpsSessionCalculator';
import { useSupabaseGPS } from '@/hooks/useSupabaseGPS';
import { useToast } from '@/hooks/use-toast';

export interface UseGPSTrackingResult {
  // State
  currentLocation: LocationData | null;
  currentState: GPSState;
  isTracking: boolean;
  hasPermissions: boolean;
  error: string | null;
  
  // Current session and timers
  currentSession: GPSSession | null;
  todaysEvents: GPSEvent[];
  sessionTimers: SessionTimers;
  currentJobId: string | null;
  
  // Settings
  settings: GPSSettings;
  updateSettings: (settings: GPSSettings) => void;
  
  // Controls
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<LocationData | null>;
  requestPermissions: () => Promise<boolean>;
  
  // Manual state actions (for notification fallbacks)
  selectWork: () => void;
  selectPrivate: () => void;
  confirmAtCustomer: () => void;
  denyAtCustomer: () => void;
  confirmWorkDone: () => void;
  denyWorkDone: () => void;
  confirmHomeArrival: () => void;
  
  // Event management
  addManualEvent: (type: GPSEvent['type'], note?: string) => void;
  clearTodaysEvents: () => void;
  
  // Job linking
  linkToJob: (jobId: string) => Promise<boolean>;
  unlinkFromJob: () => Promise<boolean>;
}

export const useGPSTracking = (): UseGPSTrackingResult => {
  const { toast } = useToast();
  const { saveSession, loadSession } = useSupabaseGPS();
  
  // State
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [currentState, setCurrentState] = useState<GPSState>('idle_at_home');
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<GPSSettings>(defaultGPSSettings);
  const [currentSession, setCurrentSession] = useState<GPSSession | null>(null);
  const [todaysEvents, setTodaysEvents] = useState<GPSEvent[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [sessionTimers, setSessionTimers] = useState<SessionTimers>({
    travelTime: 0,
    workTime: 0,
    returnTime: 0,
    currentTimer: {
      type: null,
      startTime: null,
      elapsed: 0
    }
  });
  
  // Services
  const stateMachine = useRef<GPSStateMachine | null>(null);
  const geolocationService = useRef<GeolocationService | null>(null);
  
  // Initialize services
  useEffect(() => {
    // Load settings
    const storedSettings = localStorage.getItem('gps_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse GPS settings:', error);
      }
    }
    
    // Load today's session
    loadTodaysSession();
  }, []);
  
  // Initialize services when settings change
  useEffect(() => {
    const handleStateChange = (newState: GPSState) => {
      setCurrentState(newState);
      console.log('GPS State changed to:', newState);
    };
    
    const handleEventTrigger = (event: GPSEvent) => {
      addEventToSession(event);
      
      // Show toast for important events
      const eventMessages = {
        'HOME_LEAVE': 'Home verlassen erkannt',
        'WORK_SELECTED': 'Arbeit ausgewählt - Anreise gestartet',
        'PRIVATE_SELECTED': 'Privat ausgewählt',
        'AT_CUSTOMER_START': 'Beim Kunden angekommen',
        'WORK_DONE': 'Arbeit abgeschlossen - Heimreise gestartet',
        'HOME_ARRIVAL_CONFIRMED': 'Zuhause angekommen'
      };
      
      const message = eventMessages[event.type];
      if (message) {
        toast({
          title: 'GPS Event',
          description: message
        });
      }
    };
    
    stateMachine.current = new GPSStateMachine(
      settings,
      handleStateChange,
      handleEventTrigger
    );
    
    const handleLocationUpdate = (location: LocationData) => {
      setCurrentLocation(location);
      setError(null);
      stateMachine.current?.processLocationUpdate(location);
    };
    
    const handleError = (errorMessage: string) => {
      setError(errorMessage);
      toast({
        title: 'GPS Fehler',
        description: errorMessage,
        variant: 'destructive'
      });
    };
    
    geolocationService.current = new GeolocationService(
      settings,
      handleLocationUpdate,
      handleError
    );
    
    // Check initial permissions
    checkPermissions();
  }, [settings, toast]);
  
  const checkPermissions = useCallback(async () => {
    if (geolocationService.current) {
      const hasPerms = await geolocationService.current.checkPermissions();
      setHasPermissions(hasPerms);
    }
  }, []);
  
  const loadTodaysSession = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to load from Supabase first
    const supabaseSession = await loadSession(today);
    if (supabaseSession) {
      setCurrentSession(supabaseSession);
      setTodaysEvents(supabaseSession.events);
      
      // Calculate and update timers
      const timers = GPSSessionCalculator.getLiveTimers(supabaseSession.events);
      setSessionTimers(timers);
      return;
    }
    
    // Fallback to localStorage
    const sessionKey = `gps_session_${today}`;
    const stored = localStorage.getItem(sessionKey);
    
    if (stored) {
      try {
        const session = JSON.parse(stored);
        // Convert string dates back to Date objects
        session.events = session.events.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
          location: {
            ...event.location,
            timestamp: new Date(event.location.timestamp)
          }
        }));
        
        setCurrentSession(session);
        setTodaysEvents(session.events);
        
        // Calculate and update timers
        const timers = GPSSessionCalculator.getLiveTimers(session.events);
        setSessionTimers(timers);
      } catch (error) {
        console.error('Failed to load todays session:', error);
      }
    } else {
      // Create new session for today
      const newSession: GPSSession = {
        id: crypto.randomUUID(),
        date: today,
        events: [],
        totals: {
          travelTime: 0,
          workTime: 0,
          returnTime: 0
        }
      };
      setCurrentSession(newSession);
      
      // Initialize empty timers
      setSessionTimers({
        travelTime: 0,
        workTime: 0,
        returnTime: 0,
        currentTimer: {
          type: null,
          startTime: null,
          elapsed: 0
        }
      });
    }
  }, []);
  
  const addEventToSession = useCallback((event: GPSEvent) => {
    setTodaysEvents(prev => {
      const updated = [...prev, event];
      
      // Update session with calculated totals
      const updatedSession = GPSSessionCalculator.updateSessionTotals({
        ...currentSession!,
        events: updated
      });
      
      setCurrentSession(updatedSession);
      
      // Update live timers
      const timers = GPSSessionCalculator.getLiveTimers(updated);
      setSessionTimers(timers);
      
      // Save to localStorage
      const today = new Date().toISOString().split('T')[0];
      const sessionKey = `gps_session_${today}`;
      localStorage.setItem(sessionKey, JSON.stringify(updatedSession));
      
      // Save to Supabase in background
      saveSession(updatedSession, currentJobId || undefined).catch(error => {
        console.error('Failed to sync session to Supabase:', error);
      });
      
      return updated;
    });
  }, [currentSession]);
  
  const updateSettings = useCallback((newSettings: GPSSettings) => {
    setSettings(newSettings);
    localStorage.setItem('gps_settings', JSON.stringify(newSettings));
    
    // Update services
    stateMachine.current?.updateSettings(newSettings);
    geolocationService.current?.updateSettings(newSettings);
  }, []);
  
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (!geolocationService.current) return false;
    
    const started = await geolocationService.current.startTracking();
    if (started) {
      setIsTracking(true);
      setError(null);
      
      // Start new session if needed
      if (!currentSession?.startTimestamp) {
        const updated = {
          ...currentSession!,
          startTimestamp: new Date()
        };
        setCurrentSession(updated);
      }
    }
    
    return started;
  }, [currentSession]);
  
  const stopTracking = useCallback(() => {
    geolocationService.current?.stopTracking();
    setIsTracking(false);
  }, []);
  
  const getCurrentPosition = useCallback(async (): Promise<LocationData | null> => {
    if (!geolocationService.current) return null;
    
    try {
      const location = await geolocationService.current.getCurrentPosition();
      setCurrentLocation(location);
      setError(null);
      return location;
    } catch (error) {
      // Try IP fallback
      const ipLocation = await geolocationService.current.getLocationFromIP();
      if (ipLocation) {
        setCurrentLocation(ipLocation);
        setError('GPS nicht verfügbar - IP-Standort verwendet');
        return ipLocation;
      }
      
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(message);
      return null;
    }
  }, []);
  
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!geolocationService.current) return false;
    
    const granted = await geolocationService.current.requestPermissions();
    setHasPermissions(granted);
    
    if (granted) {
      setError(null);
    }
    
    return granted;
  }, []);
  
  // Manual state transition methods
  const selectWork = useCallback(() => {
    stateMachine.current?.selectWork();
  }, []);
  
  const selectPrivate = useCallback(() => {
    stateMachine.current?.selectPrivate();
  }, []);
  
  const confirmAtCustomer = useCallback(() => {
    stateMachine.current?.confirmAtCustomer();
  }, []);
  
  const denyAtCustomer = useCallback(() => {
    stateMachine.current?.denyAtCustomer();
  }, []);
  
  const confirmWorkDone = useCallback(() => {
    stateMachine.current?.confirmWorkDone();
  }, []);
  
  const denyWorkDone = useCallback(() => {
    stateMachine.current?.denyWorkDone();
  }, []);
  
  const confirmHomeArrival = useCallback(() => {
    stateMachine.current?.confirmHomeArrival();
  }, []);
  
  const addManualEvent = useCallback((type: GPSEvent['type'], note?: string) => {
    if (!currentLocation) return;
    
    const event: GPSEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      location: currentLocation,
      note: note || 'Manuell hinzugefügt'
    };
    
    addEventToSession(event);
  }, [currentLocation, addEventToSession]);
  
  const clearTodaysEvents = useCallback(() => {
    setTodaysEvents([]);
    if (currentSession) {
      const clearedSession = {
        ...currentSession,
        events: [],
        totals: { travelTime: 0, workTime: 0, returnTime: 0 }
      };
      setCurrentSession(clearedSession);
      
      // Reset timers
      setSessionTimers({
        travelTime: 0,
        workTime: 0,
        returnTime: 0,
        currentTimer: {
          type: null,
          startTime: null,
          elapsed: 0
        }
      });
      
      const today = new Date().toISOString().split('T')[0];
      const sessionKey = `gps_session_${today}`;
      localStorage.setItem(sessionKey, JSON.stringify(clearedSession));
      
      // Save to Supabase in background
      saveSession(clearedSession, currentJobId || undefined).catch(error => {
        console.error('Failed to sync cleared session to Supabase:', error);
      });
    }
  }, [currentSession, currentJobId, saveSession]);

  // Timer update effect - updates current timer every minute
  useEffect(() => {
    if (sessionTimers.currentTimer.type) {
      const interval = setInterval(() => {
        const timers = GPSSessionCalculator.getLiveTimers(todaysEvents);
        setSessionTimers(timers);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [sessionTimers.currentTimer.type, todaysEvents]);

  const linkToJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!currentSession) return false;
    
    const { linkSessionToJob } = useSupabaseGPS();
    const success = await linkSessionToJob(currentSession.id, jobId);
    
    if (success) {
      setCurrentJobId(jobId);
      
      // Re-save current session with job link
      await saveSession(currentSession, jobId);
    }
    
    return success;
  }, [currentSession, saveSession]);

  const unlinkFromJob = useCallback(async (): Promise<boolean> => {
    if (!currentSession || !currentJobId) return false;
    
    const { linkSessionToJob } = useSupabaseGPS();
    const success = await linkSessionToJob(currentSession.id, '');
    
    if (success) {
      setCurrentJobId(null);
      
      // Re-save current session without job link
      await saveSession(currentSession);
    }
    
    return success;
  }, [currentSession, currentJobId, saveSession]);
  
  return {
    // State
    currentLocation,
    currentState,
    isTracking,
    hasPermissions,
    error,
    
    // Session
    currentSession,
    todaysEvents,
    sessionTimers,
    currentJobId,
    
    // Settings
    settings,
    updateSettings,
    
    // Controls
    startTracking,
    stopTracking,
    getCurrentPosition,
    requestPermissions,
    
    // Manual actions
    selectWork,
    selectPrivate,
    confirmAtCustomer,
    denyAtCustomer,
    confirmWorkDone,
    denyWorkDone,
    confirmHomeArrival,
    
    // Event management
    addManualEvent,
    clearTodaysEvents,
    
    // Job linking
    linkToJob,
    unlinkFromJob
  };
};