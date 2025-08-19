import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, MapPin, Timer, Home } from 'lucide-react';
import { UseGPSTrackingResult } from '@/hooks/useGPSTracking';

interface GPSStatusProps {
  gpsTracking: UseGPSTrackingResult;
}

const stateLabels = {
  idle_at_home: 'Zuhause (Bereit)',
  departing: 'Verlässt Zuhause',
  en_route_to_customer: 'Anreise zum Kunden',
  stationary_check: 'Stationär-Prüfung',
  at_customer: 'Beim Kunden',
  leaving_customer: 'Verlässt Kunde',
  en_route_home: 'Heimreise',
  stationary_home_check: 'Zuhause-Prüfung',
  done: 'Abgeschlossen'
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const GPSStatus: React.FC<GPSStatusProps> = ({ gpsTracking }) => {
  const { t } = useTranslation();
  
  const {
    currentState,
    isTracking,
    hasPermissions,
    currentLocation,
    error,
    startTracking,
    stopTracking,
    requestPermissions,
    getCurrentPosition,
    selectWork,
    selectPrivate,
    confirmAtCustomer,
    denyAtCustomer,
    confirmWorkDone,
    denyWorkDone,
    confirmHomeArrival
  } = gpsTracking;

  const handleStartTracking = async () => {
    await startTracking();
  };

  const handleStopTracking = () => {
    stopTracking();
  };

  const handleRequestPermission = async () => {
    await requestPermissions();
  };

  const handleGetCurrentPosition = async () => {
    await getCurrentPosition();
  };

  // Get live timer data
  const timers = gpsTracking.sessionTimers;

  return (
    <div className="space-y-6">
      {/* Current State */}
      <div className="space-y-3">
        <h4 className="font-medium">Aktueller Zustand</h4>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={currentState === 'idle_at_home' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {stateLabels[currentState]}
          </Badge>
          
          <Badge variant={isTracking ? 'default' : 'destructive'}>
            {isTracking ? 'Tracking aktiv' : 'Tracking gestoppt'}
          </Badge>
          
          <Badge variant={hasPermissions ? 'default' : 'destructive'}>
            {hasPermissions ? 'GPS berechtigt' : 'GPS Berechtigung fehlt'}
          </Badge>
        </div>
      </div>

      {/* Timer Badges */}
      <div className="space-y-3">
        <h4 className="font-medium">Timer</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className={`text-2xl font-mono font-bold ${
              timers.currentTimer.type === 'travel' ? 'text-primary animate-pulse' : 'text-primary'
            }`}>
              {formatTime(timers.travelTime + (timers.currentTimer.type === 'travel' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">Anreise</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className={`text-2xl font-mono font-bold ${
              timers.currentTimer.type === 'work' ? 'text-secondary animate-pulse' : 'text-secondary'
            }`}>
              {formatTime(timers.workTime + (timers.currentTimer.type === 'work' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">Arbeitszeit</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className={`text-2xl font-mono font-bold ${
              timers.currentTimer.type === 'return' ? 'text-accent animate-pulse' : 'text-accent'
            }`}>
              {formatTime(timers.returnTime + (timers.currentTimer.type === 'return' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">Heimreise</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        <h4 className="font-medium">Kontrolle</h4>
        <div className="flex flex-wrap gap-2">
          {!hasPermissions && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRequestPermission}
            >
              <MapPin className="h-4 w-4 mr-2" />
              GPS Berechtigung
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGetCurrentPosition}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Position abrufen
          </Button>

          {!isTracking ? (
            <Button 
              size="sm"
              onClick={handleStartTracking}
            >
              <Play className="h-4 w-4 mr-2" />
              Tracking starten
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleStopTracking}
            >
              <Square className="h-4 w-4 mr-2" />
              Tracking stoppen
            </Button>
          )}

          {/* Manual confirmation buttons based on current state */}
          {currentState === 'departing' && (
            <>
              <Button size="sm" onClick={selectWork}>
                <Timer className="h-4 w-4 mr-2" />
                Arbeit
              </Button>
              <Button variant="outline" size="sm" onClick={selectPrivate}>
                <Home className="h-4 w-4 mr-2" />
                Privat
              </Button>
            </>
          )}
          
          {currentState === 'stationary_check' && (
            <>
              <Button size="sm" onClick={confirmAtCustomer}>
                <Timer className="h-4 w-4 mr-2" />
                Beim Kunden
              </Button>
              <Button variant="outline" size="sm" onClick={denyAtCustomer}>
                Nicht beim Kunden
              </Button>
            </>
          )}
          
          {currentState === 'leaving_customer' && (
            <>
              <Button size="sm" onClick={confirmWorkDone}>
                <Timer className="h-4 w-4 mr-2" />
                Arbeit fertig
              </Button>
              <Button variant="outline" size="sm" onClick={denyWorkDone}>
                Weiter arbeiten
              </Button>
            </>
          )}
          
          {currentState === 'stationary_home_check' && (
            <Button size="sm" onClick={confirmHomeArrival}>
              <Home className="h-4 w-4 mr-2" />
              Heimreise beendet
            </Button>
          )}

        </div>
      </div>

      {/* Current Location Info */}
      <div className="space-y-3">
        <h4 className="font-medium">Standort-Info</h4>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
            {error}
          </div>
        )}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Letzte Position:</span>
            <div className="font-mono text-xs mt-1">
              {currentLocation 
                ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` 
                : 'Keine Position verfügbar'
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Geschwindigkeit:</span>
            <div className="font-mono text-xs mt-1">
              {currentLocation?.speed !== null && currentLocation?.speed !== undefined
                ? `${currentLocation.speed.toFixed(1)} m/s`
                : '- m/s'
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Genauigkeit:</span>
            <div className="font-mono text-xs mt-1">
              {currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(0)} m` : '- m'}
            </div>
          </div>
          
          {currentLocation && (
            <div className="text-sm">
              <span className="text-muted-foreground">Zeitstempel:</span>
              <div className="font-mono text-xs mt-1">
                {currentLocation.timestamp.toLocaleString('de-DE')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};