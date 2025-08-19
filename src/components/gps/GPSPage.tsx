import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Activity, List } from 'lucide-react';
import { GPSMap } from './GPSMap';
import { GPSStatus } from './GPSStatus';
import { GPSEventLog } from './GPSEventLog';

export const GPSPage: React.FC = () => {
  const { t } = useTranslation();

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
          <GPSMap />
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
          <GPSStatus />
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
          <GPSEventLog />
        </CardContent>
      </Card>
    </div>
  );
};