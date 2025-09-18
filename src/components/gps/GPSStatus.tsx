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
    <div className="space-y-6">
      {/* Current State */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.ui.currentState')}</h4>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={currentState === 'idle_at_home' ? 'default' : 'secondary'}
            className="text-sm"
            aria-label={`${t('gpsTracking.ui.currentState')}: ${t(`gpsTracking.ui.states.${currentState}`)}`}
          >
            {t(`gpsTracking.ui.states.${currentState}`)}
          </Badge>
          
          <Badge 
            variant={isTracking ? 'default' : 'destructive'}
            aria-label={isTracking ? t('gpsTracking.ui.trackingActive') : t('gpsTracking.ui.trackingStopped')}
          >
            {isTracking ? t('gpsTracking.ui.trackingActive') : t('gpsTracking.ui.trackingStopped')}
          </Badge>
          
          <Badge 
            variant={hasPermissions ? 'default' : 'destructive'}
            aria-label={hasPermissions ? t('gpsTracking.ui.gpsPermissionGranted') : t('gpsTracking.ui.gpsPermissionMissing')}
          >
            {hasPermissions ? t('gpsTracking.ui.gpsPermissionGranted') : t('gpsTracking.ui.gpsPermissionMissing')}
          </Badge>
        </div>
      </div>

      {/* Timer Badges */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.ui.timer')}</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div 
              className={`text-2xl font-mono font-bold ${
                timers.currentTimer.type === 'travel' ? 'text-primary animate-pulse' : 'text-primary'
              }`}
              aria-label={`${t('gpsTracking.ui.travelTime')}: ${formatTime(timers.travelTime + (timers.currentTimer.type === 'travel' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.travelTime + (timers.currentTimer.type === 'travel' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">{t('gpsTracking.ui.travelTime')}</div>
          </div>
          
          <div className="text-center space-y-1">
            <div 
              className={`text-2xl font-mono font-bold ${
                timers.currentTimer.type === 'work' ? 'text-secondary animate-pulse' : 'text-secondary'
              }`}
              aria-label={`${t('gpsTracking.ui.workTime')}: ${formatTime(timers.workTime + (timers.currentTimer.type === 'work' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.workTime + (timers.currentTimer.type === 'work' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">{t('gpsTracking.ui.workTime')}</div>
          </div>
          
          <div className="text-center space-y-1">
            <div 
              className={`text-2xl font-mono font-bold ${
                timers.currentTimer.type === 'return' ? 'text-accent animate-pulse' : 'text-accent'
              }`}
              aria-label={`${t('gpsTracking.ui.returnTime')}: ${formatTime(timers.returnTime + (timers.currentTimer.type === 'return' ? timers.currentTimer.elapsed : 0))}`}
            >
              {formatTime(timers.returnTime + (timers.currentTimer.type === 'return' ? timers.currentTimer.elapsed : 0))}
            </div>
            <div className="text-xs text-muted-foreground">{t('gpsTracking.ui.returnTime')}</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.ui.control')}</h4>
        <div className="flex flex-wrap gap-2">
          {!hasPermissions && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRequestPermission}
              aria-label={t('gpsTracking.ui.requestGpsPermission')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {t('gpsTracking.ui.requestGpsPermission')}
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGetCurrentPosition}
            aria-label={t('gpsTracking.ui.getCurrentPosition')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {t('gpsTracking.ui.getCurrentPosition')}
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
                aria-label={t('gpsTracking.ui.work')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {t('gpsTracking.ui.work')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectPrivate}
                aria-label={t('gpsTracking.ui.private')}
              >
                <Home className="h-4 w-4 mr-2" />
                {t('gpsTracking.ui.private')}
              </Button>
            </>
          )}
          
          {currentState === 'stationary_check' && (
            <>
              <Button 
                size="sm" 
                onClick={confirmAtCustomer}
                aria-label={t('gpsTracking.ui.atCustomer')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {t('gpsTracking.ui.atCustomer')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={denyAtCustomer}
                aria-label={t('gpsTracking.ui.notAtCustomer')}
              >
                {t('gpsTracking.ui.notAtCustomer')}
              </Button>
            </>
          )}
          
          {currentState === 'leaving_customer' && (
            <>
              <Button 
                size="sm" 
                onClick={confirmWorkDone}
                aria-label={t('gpsTracking.ui.workFinished')}
              >
                <Timer className="h-4 w-4 mr-2" />
                {t('gpsTracking.ui.workFinished')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={denyWorkDone}
                aria-label={t('gpsTracking.ui.continueWorking')}
              >
                {t('gpsTracking.ui.continueWorking')}
              </Button>
            </>
          )}
          
          {currentState === 'stationary_home_check' && (
            <Button 
              size="sm" 
              onClick={confirmHomeArrival}
              aria-label={t('gpsTracking.ui.tripHomeFinished')}
            >
              <Home className="h-4 w-4 mr-2" />
              {t('gpsTracking.ui.tripHomeFinished')}
            </Button>
          )}

        </div>
      </div>

      {/* Current Location Info */}
      <div className="space-y-3">
        <h4 className="font-medium">{t('gpsTracking.ui.locationInfo')}</h4>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
            {error}
          </div>
        )}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">{t('gpsTracking.ui.lastPosition')}</span>
            <div className="font-mono text-xs mt-1">
              {currentLocation 
                ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` 
                : t('gpsTracking.ui.noPositionAvailable')
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">{t('gpsTracking.ui.speed')}</span>
            <div className="font-mono text-xs mt-1">
              {currentLocation?.speed !== null && currentLocation?.speed !== undefined
                ? `${currentLocation.speed.toFixed(1)} m/s`
                : '- m/s'
              }
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">{t('gpsTracking.ui.accuracy')}</span>
            <div className="font-mono text-xs mt-1">
              {currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(0)} m` : '- m'}
            </div>
          </div>
          
          {currentLocation && (
            <div className="text-sm">
              <span className="text-muted-foreground">{t('gpsTracking.ui.timestamp')}</span>
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