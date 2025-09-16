import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MapPin, Play, Square, Clock, CheckCircle, XCircle } from 'lucide-react';
import MapView from '@/components/MapView';
import { Capacitor } from '@capacitor/core';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGPSTracking } from '@/hooks/useGPSTracking';

export const GPSPage: React.FC = () => {
  const { t } = useTranslation();
  const gpsTracking = useGPSTracking();

  // Request permissions on component mount
  useEffect(() => {
    if (!gpsTracking.hasPermissions) {
      gpsTracking.requestPermissions();
    }
  }, [gpsTracking.hasPermissions, gpsTracking.requestPermissions]);

  // Convert GPS location to map center format
  const mapCenter: [number, number] | undefined = gpsTracking.currentLocation 
    ? [gpsTracking.currentLocation.longitude, gpsTracking.currentLocation.latitude]
    : undefined;

  // Get state display info
  const getStateInfo = (state: typeof gpsTracking.currentState) => {
    const stateLabels = {
      'idle_at_home': { label: 'Zuhause', color: 'secondary' },
      'departing': { label: 'Aufbruch', color: 'warning' },
      'en_route_to_customer': { label: 'Anreise', color: 'default' },
      'stationary_check': { label: 'Standort-Check', color: 'warning' },
      'at_customer': { label: 'Beim Kunden', color: 'success' },
      'leaving_customer': { label: 'Abreise', color: 'warning' },
      'en_route_home': { label: 'Heimreise', color: 'default' },
      'stationary_home_check': { label: 'Zuhause-Check', color: 'warning' },
      'done': { label: 'Erledigt', color: 'success' }
    } as const;
    
    return stateLabels[state] || { label: state, color: 'secondary' as const };
  };

  const stateInfo = getStateInfo(gpsTracking.currentState);

  // Format time function
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">GPS Tracking</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={stateInfo.color as any}>
              {stateInfo.label}
            </Badge>
            {gpsTracking.currentJobId && (
              <Badge variant="outline">
                Job: {gpsTracking.currentJobId.slice(-8)}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={gpsTracking.getCurrentPosition}
            disabled={!gpsTracking.hasPermissions}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Position
          </Button>
          
          {!gpsTracking.isTracking ? (
            <Button 
              onClick={gpsTracking.startTracking}
              disabled={!gpsTracking.hasPermissions}
              className="flex items-center gap-2"
              size="sm"
            >
              <Play className="h-4 w-4" />
              {t('startTracking')}
            </Button>
          ) : (
            <Button 
              onClick={gpsTracking.stopTracking}
              variant="destructive"
              className="flex items-center gap-2"
              size="sm"
            >
              <Square className="h-4 w-4" />
              {t('stopTracking')}
            </Button>
          )}
        </div>
      </div>

      {/* Permissions/Error Alert */}
      {!gpsTracking.hasPermissions && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-700">
            Standortberechtigung erforderlich. Bitte in den Systemeinstellungen erlauben.
          </AlertDescription>
        </Alert>
      )}
      
      {gpsTracking.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            {gpsTracking.error}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Map View */}
      <MapView center={mapCenter} />
      
      {/* State Controls Card */}
      {gpsTracking.currentState !== 'idle_at_home' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Manuelle Aktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gpsTracking.currentState === 'departing' && (
                <>
                  <Button
                    onClick={gpsTracking.selectWork}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Arbeit
                  </Button>
                  <Button
                    onClick={gpsTracking.selectPrivate}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Privat
                  </Button>
                </>
              )}
              
              {gpsTracking.currentState === 'stationary_check' && (
                <>
                  <Button
                    onClick={gpsTracking.confirmAtCustomer}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Beim Kunden
                  </Button>
                  <Button
                    onClick={gpsTracking.denyAtCustomer}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Weiterfahrt
                  </Button>
                </>
              )}
              
              {gpsTracking.currentState === 'leaving_customer' && (
                <>
                  <Button
                    onClick={gpsTracking.confirmWorkDone}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Arbeit fertig
                  </Button>
                  <Button
                    onClick={gpsTracking.denyWorkDone}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Zurück zu Kunde
                  </Button>
                </>
              )}
              
              {gpsTracking.currentState === 'stationary_home_check' && (
                <Button
                  onClick={gpsTracking.confirmHomeArrival}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Zuhause angekommen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Session Timers Card */}
      {gpsTracking.isTracking && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Heutige Arbeitszeiten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium">{formatTime(gpsTracking.sessionTimers.travelTime)}</p>
                <p className="text-muted-foreground">Anreise</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{formatTime(gpsTracking.sessionTimers.workTime)}</p>
                <p className="text-muted-foreground">Arbeit</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{formatTime(gpsTracking.sessionTimers.returnTime)}</p>
                <p className="text-muted-foreground">Rückfahrt</p>
              </div>
            </div>
            
            {gpsTracking.sessionTimers.currentTimer.type && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-center">
                  <span className="font-medium">Aktiv:</span>{' '}
                  {gpsTracking.sessionTimers.currentTimer.type === 'travel' ? 'Anreise' :
                   gpsTracking.sessionTimers.currentTimer.type === 'work' ? 'Arbeit' : 'Rückfahrt'}{' '}
                  ({formatTime(gpsTracking.sessionTimers.currentTimer.elapsed)})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Recent Events */}
      {gpsTracking.todaysEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Heutige GPS-Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {gpsTracking.todaysEvents.slice(-5).reverse().map((event) => (
                <div key={event.id} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                  <div>
                    <p className="font-medium">{event.type.replace(/_/g, ' ')}</p>
                    {event.note && <p className="text-muted-foreground">{event.note}</p>}
                  </div>
                  <p className="text-muted-foreground">
                    {event.timestamp.toLocaleTimeString('de-DE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              ))}
            </div>
            
            {gpsTracking.todaysEvents.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ... und {gpsTracking.todaysEvents.length - 5} weitere Events
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* System Info */}
      <div className="text-xs text-muted-foreground">
        Plattform: {Capacitor.getPlatform()} · 
        Secure Context: {typeof window !== 'undefined' && window.isSecureContext ? 'Ja' : 'Nein'} · 
        Status: {gpsTracking.isTracking ? 'Tracking aktiv' : 'Tracking inaktiv'} ·
        Berechtigung: {gpsTracking.hasPermissions ? 'Erteilt' : 'Fehlt'}
      </div>
    </div>
  );
};