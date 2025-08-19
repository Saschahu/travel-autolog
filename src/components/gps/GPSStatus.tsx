import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, MapPin, Timer, Home } from 'lucide-react';

// Mock data for Phase 1
const mockStatus = {
  state: 'idle_at_home' as const,
  isTracking: false,
  timers: {
    travel: 0,
    work: 0,
    return: 0
  },
  hasPermission: false
};

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

export const GPSStatus: React.FC = () => {
  const { t } = useTranslation();

  const handleStartTracking = () => {
    console.log('Start tracking - will be implemented in Phase 3');
  };

  const handleStopTracking = () => {
    console.log('Stop tracking - will be implemented in Phase 3');
  };

  const handleRequestPermission = () => {
    console.log('Request permission - will be implemented in Phase 3');
  };

  const handleManualConfirm = () => {
    console.log('Manual confirm - will be implemented in Phase 4');
  };

  return (
    <div className="space-y-6">
      {/* Current State */}
      <div className="space-y-3">
        <h4 className="font-medium">Aktueller Zustand</h4>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={mockStatus.state === 'idle_at_home' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {stateLabels[mockStatus.state]}
          </Badge>
          
          <Badge variant={mockStatus.isTracking ? 'default' : 'destructive'}>
            {mockStatus.isTracking ? 'Tracking aktiv' : 'Tracking gestoppt'}
          </Badge>
          
          <Badge variant={mockStatus.hasPermission ? 'default' : 'destructive'}>
            {mockStatus.hasPermission ? 'GPS berechtigt' : 'GPS Berechtigung fehlt'}
          </Badge>
        </div>
      </div>

      {/* Timer Badges */}
      <div className="space-y-3">
        <h4 className="font-medium">Timer</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-mono font-bold text-primary">
              {formatTime(mockStatus.timers.travel)}
            </div>
            <div className="text-xs text-muted-foreground">Anreise</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-2xl font-mono font-bold text-secondary">
              {formatTime(mockStatus.timers.work)}
            </div>
            <div className="text-xs text-muted-foreground">Arbeitszeit</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-2xl font-mono font-bold text-accent">
              {formatTime(mockStatus.timers.return)}
            </div>
            <div className="text-xs text-muted-foreground">Heimreise</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        <h4 className="font-medium">Kontrolle</h4>
        <div className="flex flex-wrap gap-2">
          {!mockStatus.hasPermission && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRequestPermission}
            >
              <MapPin className="h-4 w-4 mr-2" />
              GPS Berechtigung
            </Button>
          )}

          {!mockStatus.isTracking ? (
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

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualConfirm}
          >
            <Timer className="h-4 w-4 mr-2" />
            Manuell bestätigen
          </Button>
        </div>
      </div>

      {/* Current Location Info */}
      <div className="space-y-3">
        <h4 className="font-medium">Standort-Info</h4>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Letzte Position:</span>
            <div className="font-mono text-xs mt-1">
              Wird in Phase 3 implementiert
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Geschwindigkeit:</span>
            <div className="font-mono text-xs mt-1">
              - m/s
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Genauigkeit:</span>
            <div className="font-mono text-xs mt-1">
              - m
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};