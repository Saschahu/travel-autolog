import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Crosshair, Settings, Navigation } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';

export const LocationSettings = () => {
  const {
    currentLocation,
    homeLocation,
    isAtHome,
    isTracking,
    setCurrentAsHome,
    saveHomeLocation,
    getCurrentPosition,
    startTracking,
    stopTracking,
    requestPermissions
  } = useLocation();

  const { toast } = useToast();
  const [watchId, setWatchId] = useState<string | null>(null);
  const [homeRadius, setHomeRadius] = useState(100);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  useEffect(() => {
    if (homeLocation) {
      setHomeRadius(homeLocation.radius);
    }
  }, [homeLocation]);

  const handleGetCurrentLocation = async () => {
    const location = await getCurrentPosition();
    if (location) {
      toast({
        title: 'Standort aktualisiert',
        description: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
      });
    } else {
      toast({
        title: 'Fehler',
        description: 'Standort konnte nicht ermittelt werden',
        variant: 'destructive',
      });
    }
  };

  const handleSetCurrentAsHome = async () => {
    await setCurrentAsHome(homeRadius);
    toast({
      title: 'Zuhause gesetzt',
      description: 'Aktueller Standort wurde als Zuhause gespeichert',
    });
  };

  const handleSetManualHome = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: 'Fehler',
        description: 'Bitte gültige Koordinaten eingeben',
        variant: 'destructive',
      });
      return;
    }

    await saveHomeLocation({
      latitude: lat,
      longitude: lng,
      radius: homeRadius
    });

    toast({
      title: 'Zuhause gesetzt',
      description: 'Manueller Standort wurde als Zuhause gespeichert',
    });
  };

  const handleToggleTracking = async () => {
    if (isTracking && watchId) {
      await stopTracking(watchId);
      setWatchId(null);
      toast({
        title: 'Tracking gestoppt',
        description: 'Standortverfolgung wurde deaktiviert',
      });
    } else {
      const id = await startTracking();
      if (id) {
        setWatchId(id);
        toast({
          title: 'Tracking gestartet',
          description: 'Standortverfolgung ist aktiv',
        });
      } else {
        toast({
          title: 'Fehler',
          description: 'Tracking konnte nicht gestartet werden',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Standort Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">GPS Tracking</span>
            <div className="flex items-center gap-2">
              <Badge variant={isTracking ? "default" : "secondary"}>
                {isTracking ? 'Aktiv' : 'Inaktiv'}
              </Badge>
              <Switch
                checked={isTracking}
                onCheckedChange={handleToggleTracking}
              />
            </div>
          </div>

          {homeLocation && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={isAtHome ? "secondary" : "outline"}>
                {isAtHome ? 'Zuhause' : 'Unterwegs'}
              </Badge>
            </div>
          )}

          {currentLocation && (
            <div className="space-y-1">
              <span className="text-sm font-medium">Aktueller Standort</span>
              <p className="text-xs text-muted-foreground font-mono">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            Aktueller Standort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGetCurrentLocation} className="w-full">
            <MapPin className="h-4 w-4 mr-2" />
            GPS Position abrufen
          </Button>
          
          {currentLocation && (
            <Button onClick={handleSetCurrentAsHome} variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Als Zuhause setzen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Home Location Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Zuhause Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {homeLocation && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Gespeichertes Zuhause</span>
              <p className="text-xs text-muted-foreground font-mono">
                {homeLocation.latitude.toFixed(6)}, {homeLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="home-radius">Radius (Meter)</Label>
            <Input
              id="home-radius"
              type="number"
              min="10"
              max="1000"
              value={homeRadius}
              onChange={(e) => setHomeRadius(parseInt(e.target.value) || 100)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Entfernung vom Zuhause-Punkt für Erkennung
            </p>
          </div>

          <div className="space-y-2">
            <Label>Manuell setzen</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Breitengrad"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
              />
              <Input
                placeholder="Längengrad"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSetManualHome} 
              variant="outline" 
              size="sm"
              disabled={!manualLat || !manualLng}
            >
              Manuell setzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Anleitung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. GPS Position abrufen um deinen aktuellen Standort zu ermitteln</p>
          <p>2. "Als Zuhause setzen" um den aktuellen Standort zu speichern</p>
          <p>3. GPS Tracking aktivieren für automatische Erkennung</p>
          <p>4. Die App benachrichtigt dich beim Verlassen des Zuhause-Bereichs</p>
        </CardContent>
      </Card>
    </div>
  );
};