// GPS Tracking Settings Component
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Navigation, 
  Download, 
  Trash2, 
  Activity, 
  MapPin, 
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const GPSTrackingSettings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const {
    status,
    isTracking,
    error,
    pointCount,
    distance,
    distanceMeters,
    toggleTracking,
    clearError,
    exportGPX,
    exportGeoJSON,
    cleanupOldTracks,
  } = useRouteTracking();

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const deletedCount = await cleanupOldTracks(60);
      toast({
        title: 'Cleanup Successful',
        description: `Deleted ${deletedCount} old tracks`,
      });
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: 'Failed to cleanup old tracks',
        variant: 'destructive',
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleExportGPX = async () => {
    try {
      await exportGPX();
      toast({
        title: 'Export Successful',
        description: 'GPX file downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export track',
        variant: 'destructive',
      });
    }
  };

  const handleExportGeoJSON = async () => {
    try {
      await exportGeoJSON();
      toast({
        title: 'Export Successful',
        description: 'GeoJSON file downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export track',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500">
            <Activity className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case 'starting':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Starting...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <CheckCircle className="mr-1 h-3 w-3" />
            Stopped
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* GPS Route Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            GPS Route Tracking
          </CardTitle>
          <CardDescription>
            Record GPS points to create daily route tracks with distance calculation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="outline" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Tracking Control */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-medium">Enable Tracking</div>
                <div className="text-sm text-muted-foreground">
                  Record GPS points while active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Switch
                checked={isTracking}
                onCheckedChange={toggleTracking}
                disabled={status === 'starting'}
              />
            </div>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Points Today
              </div>
              <div className="text-2xl font-bold">{pointCount}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Navigation className="h-4 w-4" />
                Distance Today
              </div>
              <div className="text-2xl font-bold">{distance}</div>
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Export Today's Track</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGPX}
                disabled={pointCount === 0}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Export GPX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGeoJSON}
                disabled={pointCount === 0}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Export GeoJSON
              </Button>
            </div>
            {pointCount === 0 && (
              <p className="text-xs text-muted-foreground">
                No GPS data recorded today
              </p>
            )}
          </div>

          <Separator />

          {/* Maintenance */}
          <div className="space-y-3">
            <h4 className="font-medium">Maintenance</h4>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCleaningUp}
                >
                  {isCleaningUp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Cleanup Old Tracks
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Old Tracks?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all GPS tracks older than 60 days. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanup}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground">
              Automatically removes tracks older than 60 days
            </p>
          </div>

          {/* Background Mode Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Background tracking requires additional permissions on Android devices.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};