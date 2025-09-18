import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, MapPin, Timer, Home } from 'lucide-react';
import { UseGPSTrackingResult } from '@/hooks/useGPSTracking';

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
    <div className="space-y-6" role="region" aria-label={t('gpsTracking.status.currentState')}>
      {/* Current State */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.status.currentState')}</h4>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('gpsTracking.status.currentState')}>
          <Badge 
            variant={currentState === 'idle_at_home' ? 'default' : 'secondary'}
            className="text-sm"
            aria-label={`${t('gpsTracking.status.currentState')}: ${t(`gpsTracking.status.states.${currentState}`)}`}
          >
            {t(`gpsTracking.status.states.${currentState}`)}
          </Badge>
          
          <Badge 
            variant={isTracking ? 'default' : 'destructive'}
            aria-label={isTracking ? t('gpsTracking.status.trackingActive') : t('gpsTracking.status.trackingStopped')}
          >
            {isTracking ? t('gpsTracking.status.trackingActive') : t('gpsTracking.status.trackingStopped')}
          </Badge>
          
          <Badge 
            variant={hasPermissions ? 'default' : 'destructive'}
            aria-label={hasPermissions ? t('gpsTracking.status.gpsAuthorized') : t('gpsTracking.status.gpsPermissionMissing')}
          >
            {hasPermissions ? t('gpsTracking.status.gpsAuthorized') : t('gpsTracking.status.gpsPermissionMissing')}
          </Badge>
        </div>
      </div>

      {/* Timer Badges */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.status.timers')}</h4>
        <div className="grid grid-cols-3 gap-4" role="group" aria-label={t('gpsTracking.status.timers')}>
          <div className="text-center space-y-1">
            <div className={`text-2xl font-mono font-bold ${
              timers.currentTimer.type === 'travel' ? 'text-primary animate-pulse' : 'text-primary'
            }`}
            aria-label={`${t('gpsTracking.status.travel')}: ${formatTime(timers.travelTime + (timers.currentTimer.type === 'travel' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.travelTime + (timers.currentTimer.type === 'travel' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">{t('gpsTracking.status.travel')}</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className={`text-2xl font-mono font-bold ${
              timers.currentTimer.type === 'work' ? 'text-secondary animate-pulse' : 'text-secondary'
            }`}
            aria-label={`${t('gpsTracking.status.workTime')}: ${formatTime(timers.workTime + (timers.currentTimer.type === 'work' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.workTime + (timers.currentTimer.type === 'work' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">{t('gpsTracking.status.workTime')}</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className={`text-2xl font-mono font-bold ${
              timers.currentTimer.type === 'return' ? 'text-accent animate-pulse' : 'text-accent'
            }`}
            aria-label={`${t('gpsTracking.status.return')}: ${formatTime(timers.returnTime + (timers.currentTimer.type === 'return' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.returnTime + (timers.currentTimer.type === 'return' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">{t('gpsTracking.status.return')}</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.status.control')}</h4>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('gpsTracking.status.control')}>
          {!hasPermissions && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRequestPermission}
              aria-label={t('gpsTracking.status.requestGpsPermission')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {t('gpsTracking.status.requestGpsPermission')}
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGetCurrentPosition}
            aria-label={t('gpsTracking.status.getCurrentPosition')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {t('gpsTracking.status.getCurrentPosition')}
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
                aria-label={t('gpsTracking.status.work')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {t('gpsTracking.status.work')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectPrivate}
                aria-label={t('gpsTracking.status.private')}
              >
                <Home className="h-4 w-4 mr-2" />
                {t('gpsTracking.status.private')}
              </Button>
            </>
          )}
          
          {currentState === 'stationary_check' && (
            <>
              <Button 
                size="sm" 
                onClick={confirmAtCustomer}
                aria-label={t('gpsTracking.status.atCustomer')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {t('gpsTracking.status.atCustomer')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={denyAtCustomer}
                aria-label={t('gpsTracking.status.notAtCustomer')}
              >
                {t('gpsTracking.status.notAtCustomer')}
              </Button>
            </>
          )}
          
          {currentState === 'leaving_customer' && (
            <>
              <Button 
                size="sm" 
                onClick={confirmWorkDone}
                aria-label={t('gpsTracking.status.workFinished')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {t('gpsTracking.status.workFinished')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={denyWorkDone}
                aria-label={t('gpsTracking.status.continueWorking')}
              >
                {t('gpsTracking.status.continueWorking')}
              </Button>
            </>
          )}
          
          {currentState === 'stationary_home_check' && (
            <Button 
              size="sm" 
              onClick={confirmHomeArrival}
              aria-label={t('gpsTracking.status.tripFinished')}
            >
              <Home className="h-4 w-4 mr-2" />
              {t('gpsTracking.status.tripFinished')}
            </Button>
          )}

        </div>
      </div>

      {/* Current Location Info */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.status.locationInfo')}</h4>
        {error && (
          <div 
            className="text-sm text-destructive bg-destructive/10 p-3 rounded"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2" role="region" aria-label={t('gpsTracking.status.locationInfo')}>
          <div className="text-sm">
            <span className="text-muted-foreground">{t('gpsTracking.status.lastPosition')}:</span>
            <div className="font-mono text-xs mt-1" aria-label={`${t('gpsTracking.status.lastPosition')}: ${currentLocation 
                ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` 
                : t('gpsTracking.status.noPositionAvailable')
              }`}>
              {currentLocation 
                ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` 
                : t('gpsTracking.status.noPositionAvailable')
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">{t('gpsTracking.status.speed')}:</span>
            <div 
              className="font-mono text-xs mt-1"
              aria-label={`${t('gpsTracking.status.speed')}: ${currentLocation?.speed !== null && currentLocation?.speed !== undefined
                ? `${currentLocation.speed.toFixed(1)} m/s`
                : '- m/s'
              }`}
            >
              {currentLocation?.speed !== null && currentLocation?.speed !== undefined
                ? `${currentLocation.speed.toFixed(1)} m/s`
                : '- m/s'
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">{t('gpsTracking.status.accuracy')}:</span>
            <div 
              className="font-mono text-xs mt-1"
              aria-label={`${t('gpsTracking.status.accuracy')}: ${currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(0)} m` : '- m'}`}
            >
              {currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(0)} m` : '- m'}
            </div>
          </div>
          
          {currentLocation && (
            <div className="text-sm">
              <span className="text-muted-foreground">{t('gpsTracking.status.timestamp')}:</span>
              <div 
                className="font-mono text-xs mt-1"
                aria-label={`${t('gpsTracking.status.timestamp')}: ${currentLocation.timestamp.toLocaleString('de-DE')}`}
              >
                {currentLocation.timestamp.toLocaleString('de-DE')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};