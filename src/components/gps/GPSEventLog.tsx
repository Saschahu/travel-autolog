import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MapPin, Clock, Home, Briefcase } from 'lucide-react';
import { GPSEvent, GPSEventType } from '@/types/gps-events';

interface GPSEventLogProps {
  events: GPSEvent[];
  onAddManualEvent: (type: GPSEventType, note?: string) => void;
  onClearEvents: () => void;
}

// Mock events for Phase 1
const mockEvents = [
  {
    id: '1',
    timestamp: new Date('2024-01-19T08:15:00'),
    type: 'HOME_LEAVE',
    location: { lat: 47.3769, lng: 8.5417 },
    note: 'Home-Geofence verlassen'
  },
  {
    id: '2', 
    timestamp: new Date('2024-01-19T08:16:00'),
    type: 'WORK_SELECTED',
    location: { lat: 47.3769, lng: 8.5417 },
    note: 'Arbeit ausgewählt'
  },
  {
    id: '3',
    timestamp: new Date('2024-01-19T09:45:00'),
    type: 'AT_CUSTOMER_START',
    location: { lat: 47.2581, lng: 8.4142 },
    note: 'Beim Kunden angekommen',
    customer: 'Musterfirma AG'
  }
];

const eventTypeLabels = {
  HOME_LEAVE: 'Home verlassen',
  WORK_SELECTED: 'Arbeit gewählt',
  PRIVATE_SELECTED: 'Privat gewählt',
  ARRIVAL_CANDIDATE: 'Ankunft erkannt',
  AT_CUSTOMER_START: 'Arbeit begonnen',
  AT_CUSTOMER_END: 'Arbeit beendet',
  WORK_DONE: 'Arbeit abgeschlossen',
  HOME_ARRIVAL_CONFIRMED: 'Heimankunft bestätigt'
};

const eventTypeIcons = {
  HOME_LEAVE: Home,
  WORK_SELECTED: Briefcase,
  PRIVATE_SELECTED: Home,
  ARRIVAL_CANDIDATE: MapPin,
  AT_CUSTOMER_START: Clock,
  AT_CUSTOMER_END: Clock,
  WORK_DONE: Briefcase,
  HOME_ARRIVAL_CONFIRMED: Home
};

const eventTypeColors = {
  HOME_LEAVE: 'destructive',
  WORK_SELECTED: 'default',
  PRIVATE_SELECTED: 'secondary',
  ARRIVAL_CANDIDATE: 'outline',
  AT_CUSTOMER_START: 'default',
  AT_CUSTOMER_END: 'secondary',
  WORK_DONE: 'default',
  HOME_ARRIVAL_CONFIRMED: 'default'
} as const;

export const GPSEventLog: React.FC<GPSEventLogProps> = ({ events, onAddManualEvent, onClearEvents }) => {
  const handleEditEvent = (eventId: string) => {
    console.log('Edit event:', eventId, '- will be implemented in Phase 5');
  };

  const handleSetCustomer = () => {
    console.log('Set customer - will be implemented in Phase 4');
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCoordinates = (location: { lat: number; lng: number }): string => {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSetCustomer}
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Kunde setzen/ändern
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {mockEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Heute noch keine Events</p>
            <p className="text-xs mt-1">Events werden automatisch beim Tracking erstellt</p>
          </div>
        ) : (
          <>
            {mockEvents.map((event) => {
              const IconComponent = eventTypeIcons[event.type as keyof typeof eventTypeIcons];
              const eventTypeColor = eventTypeColors[event.type as keyof typeof eventTypeColors];
              
              return (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={eventTypeColor} className="text-xs">
                        {eventTypeLabels[event.type as keyof typeof eventTypeLabels]}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      {event.note}
                      {event.customer && (
                        <span className="text-primary ml-2">
                          • {event.customer}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground font-mono">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {formatCoordinates(event.location)}
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditEvent(event.id)}
                    className="flex-shrink-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Summary */}
      {mockEvents.length > 0 && (
        <div className="border-t pt-3 mt-4">
          <div className="text-xs text-muted-foreground text-center">
            {mockEvents.length} Events heute • Letzte Aktualisierung: {formatTime(new Date())}
          </div>
        </div>
      )}
    </div>
  );
};