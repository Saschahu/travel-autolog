import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, MapPin, Timer, Home } from 'lucide-react';
import { UseGPSTrackingResult } from '@/hooks/useGPSTracking';
import { tt } from '@/lib/i18nSafe';

interface GPSStatusProps {
  gpsTracking: UseGPSTrackingResult;
}

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
        <h4 className="font-medium" role="heading" aria-level={4}>
          {tt(t, 'gpsTracking.status.currentState', 'Aktueller Zustand')}
        </h4>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={currentState === 'idle_at_home' ? 'default' : 'secondary'}
            className="text-sm"
            role="status"
            aria-label={`${tt(t, 'gpsTracking.status.currentState', 'Aktueller Zustand')}: ${tt(t, `gpsTracking.status.states.${currentState}`, currentState)}`}
          >
            {tt(t, `gpsTracking.status.states.${currentState}`, currentState)}
          </Badge>
          
          <Badge 
            variant={isTracking ? 'default' : 'destructive'}
            role="status"
            aria-label={isTracking 
              ? tt(t, 'gpsTracking.status.trackingActive', 'Tracking aktiv')
              : tt(t, 'gpsTracking.status.trackingStopped', 'Tracking gestoppt')
            }
          >
            {isTracking 
              ? tt(t, 'gpsTracking.status.trackingActive', 'Tracking aktiv')
              : tt(t, 'gpsTracking.status.trackingStopped', 'Tracking gestoppt')
            }
          </Badge>
          
          <Badge 
            variant={hasPermissions ? 'default' : 'destructive'}
            role="status"
            aria-label={hasPermissions 
              ? tt(t, 'gpsTracking.status.gpsAuthorized', 'GPS berechtigt')
              : tt(t, 'gpsTracking.status.gpsPermissionMissing', 'GPS Berechtigung fehlt')
            }
          >
            {hasPermissions 
              ? tt(t, 'gpsTracking.status.gpsAuthorized', 'GPS berechtigt')
              : tt(t, 'gpsTracking.status.gpsPermissionMissing', 'GPS Berechtigung fehlt')
            }
          </Badge>
        </div>
      </div>

      {/* Timer Badges */}
      <div className="space-y-3">
        <h4 className="font-medium" role="heading" aria-level={4}>
          {tt(t, 'gpsTracking.status.timer', 'Timer')}
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div 
              className={`text-2xl font-mono font-bold ${
                timers.currentTimer.type === 'travel' ? 'text-primary animate-pulse' : 'text-primary'
              }`}
              role="timer"
              aria-label={`${tt(t, 'gpsTracking.status.travelTime', 'Anreise')}: ${formatTime(timers.travelTime + (timers.currentTimer.type === 'travel' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.travelTime + (timers.currentTimer.type === 'travel' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">
              {tt(t, 'gpsTracking.status.travelTime', 'Anreise')}
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <div 
              className={`text-2xl font-mono font-bold ${
                timers.currentTimer.type === 'work' ? 'text-secondary animate-pulse' : 'text-secondary'
              }`}
              role="timer"
              aria-label={`${tt(t, 'gpsTracking.status.workTime', 'Arbeitszeit')}: ${formatTime(timers.workTime + (timers.currentTimer.type === 'work' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.workTime + (timers.currentTimer.type === 'work' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">
              {tt(t, 'gpsTracking.status.workTime', 'Arbeitszeit')}
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <div 
              className={`text-2xl font-mono font-bold ${
                timers.currentTimer.type === 'return' ? 'text-accent animate-pulse' : 'text-accent'
              }`}
              role="timer"
              aria-label={`${tt(t, 'gpsTracking.status.returnTime', 'Heimreise')}: ${formatTime(timers.returnTime + (timers.currentTimer.type === 'return' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.returnTime + (timers.currentTimer.type === 'return' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">
              {tt(t, 'gpsTracking.status.returnTime', 'Heimreise')}
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        <h4 className="font-medium" role="heading" aria-level={4}>
          {tt(t, 'gpsTracking.status.control', 'Kontrolle')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {!hasPermissions && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRequestPermission}
              aria-label={tt(t, 'gpsTracking.status.gpsPermission', 'GPS Berechtigung')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {tt(t, 'gpsTracking.status.gpsPermission', 'GPS Berechtigung')}
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGetCurrentPosition}
            aria-label={tt(t, 'gpsTracking.status.getPosition', 'Position abrufen')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {tt(t, 'gpsTracking.status.getPosition', 'Position abrufen')}
          </Button>

          {!isTracking ? (
            <Button 
              size="sm"
              onClick={handleStartTracking}
              aria-label={t('startTracking')}
            >
              <Play className="h-4 w-4 mr-2" />
              {t('startTracking')}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleStopTracking}
              aria-label={t('stopTracking')}
            >
              <Square className="h-4 w-4 mr-2" />
              {t('stopTracking')}
            </Button>
          )}

          {/* Manual confirmation buttons based on current state */}
          {currentState === 'departing' && (
            <>
              <Button 
                size="sm" 
                onClick={selectWork}
                aria-label={tt(t, 'gpsTracking.status.work', 'Arbeit')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {tt(t, 'gpsTracking.status.work', 'Arbeit')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectPrivate}
                aria-label={tt(t, 'gpsTracking.status.private', 'Privat')}
              >
                <Home className="h-4 w-4 mr-2" />
                {tt(t, 'gpsTracking.status.private', 'Privat')}
              </Button>
            </>
          )}
          
          {currentState === 'stationary_check' && (
            <>
              <Button 
                size="sm" 
                onClick={confirmAtCustomer}
                aria-label={tt(t, 'gpsTracking.status.atCustomer', 'Beim Kunden')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {tt(t, 'gpsTracking.status.atCustomer', 'Beim Kunden')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={denyAtCustomer}
                aria-label={tt(t, 'gpsTracking.status.notAtCustomer', 'Nicht beim Kunden')}
              >
                {tt(t, 'gpsTracking.status.notAtCustomer', 'Nicht beim Kunden')}
              </Button>
            </>
          )}
          
          {currentState === 'leaving_customer' && (
            <>
              <Button 
                size="sm" 
                onClick={confirmWorkDone}
                aria-label={tt(t, 'gpsTracking.status.workDone', 'Arbeit fertig')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {tt(t, 'gpsTracking.status.workDone', 'Arbeit fertig')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={denyWorkDone}
                aria-label={tt(t, 'gpsTracking.status.continueWorking', 'Weiter arbeiten')}
              >
                {tt(t, 'gpsTracking.status.continueWorking', 'Weiter arbeiten')}
              </Button>
            </>
          )}
          
          {currentState === 'stationary_home_check' && (
            <Button 
              size="sm" 
              onClick={confirmHomeArrival}
              aria-label={tt(t, 'gpsTracking.status.returnCompleted', 'Heimreise beendet')}
            >
              <Home className="h-4 w-4 mr-2" />
              {tt(t, 'gpsTracking.status.returnCompleted', 'Heimreise beendet')}
            </Button>
          )}

        </div>
      </div>

      {/* Current Location Info */}
      <div className="space-y-3">
        <h4 className="font-medium" role="heading" aria-level={4}>
          {tt(t, 'gpsTracking.status.locationInfo', 'Standort-Info')}
        </h4>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded" role="alert">
            {error}
          </div>
        )}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {tt(t, 'gpsTracking.status.lastPosition', 'Letzte Position')}:
            </span>
            <div className="font-mono text-xs mt-1">
              {currentLocation 
                ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` 
                : tt(t, 'gpsTracking.status.noPositionAvailable', 'Keine Position verfügbar')
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">
              {tt(t, 'gpsTracking.status.speed', 'Geschwindigkeit')}:
            </span>
            <div className="font-mono text-xs mt-1">
              {currentLocation?.speed !== null && currentLocation?.speed !== undefined
                ? `${currentLocation.speed.toFixed(1)} m/s`
                : '- m/s'
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">
              {tt(t, 'gpsTracking.status.accuracy', 'Genauigkeit')}:
            </span>
            <div className="font-mono text-xs mt-1">
              {currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(0)} m` : '- m'}
            </div>
          </div>
          
          {currentLocation && (
            <div className="text-sm">
              <span className="text-muted-foreground">
                {tt(t, 'gpsTracking.status.timestamp', 'Zeitstempel')}:
              </span>
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