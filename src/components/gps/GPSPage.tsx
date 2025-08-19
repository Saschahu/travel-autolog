import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import MapView from '@/components/MapView';

export const GPSPage: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | undefined>();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird von diesem Browser nicht unterstützt');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      // Mapbox expects [lng, lat] format
      setCurrentPosition([position.coords.longitude, position.coords.latitude]);
    } catch (error) {
      console.error('Fehler beim Abrufen der Position:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">GPS</h1>
        <Button 
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          {isGettingLocation ? 'Wird abgerufen...' : 'Position abrufen'}
        </Button>
      </div>
      
      <MapView center={currentPosition} />
      
      <div className="text-sm text-gray-600">
        Hinweis: Mapbox-Token über <b>Einstellungen → GPS</b> eintragen. Einstellungen zu Style/Geofence ebenfalls dort.
      </div>
    </div>
  );
};