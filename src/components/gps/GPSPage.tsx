import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Activity, List } from 'lucide-react';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { GPSMap } from './GPSMap';
import { GPSStatus } from './GPSStatus';
import { GPSEventLog } from './GPSEventLog';

export const GPSPage: React.FC = () => {
  const { t } = useTranslation();
  const gpsTracking = useGPSTracking();

  return (
    <div className="space-y-6 p-4">
      {/* Live Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live-Karte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <GPSMap 
            currentLocation={gpsTracking.currentLocation}
            homeLocation={gpsTracking.settings.homeLocation}
            todaysEvents={gpsTracking.todaysEvents}
          />
        </CardContent>
      </Card>

      {/* Status & Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status & Kontrolle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GPSStatus gpsTracking={gpsTracking} />
        </CardContent>
      </Card>

      {/* Event Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Event-Log (heute)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GPSEventLog 
            events={gpsTracking.todaysEvents}
            onAddManualEvent={gpsTracking.addManualEvent}
            onClearEvents={gpsTracking.clearTodaysEvents}
          />
        </CardContent>
      </Card>
    </div>
  );
};