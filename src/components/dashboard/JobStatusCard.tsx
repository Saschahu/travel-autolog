import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface JobStatusCardProps {
  customerName: string;
  status: 'active' | 'completed' | 'pending';
  startDate: Date;
  estimatedDays?: number;
  currentDay?: number;
  workStartTime?: string;
  workEndTime?: string;
  totalHours?: number | string;
  onDetails?: () => void;
  onEdit?: () => void;
}

export const JobStatusCard = ({ 
  customerName, 
  status, 
  startDate, 
  estimatedDays = 1,
  currentDay = 1,
  workStartTime,
  workEndTime,
  totalHours,
  onDetails,
  onEdit,
}: JobStatusCardProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'pending':
        return 'outline';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'completed':
        return 'Abgeschlossen';
      case 'pending':
        return 'Ausstehend';
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{customerName}</CardTitle>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Startdatum: {format(startDate, 'dd.MM.yyyy', { locale: de })}</span>
        </div>

        {(workStartTime || workEndTime || totalHours) && (
          <div className="bg-secondary/30 p-3 rounded-md space-y-2">
            <h4 className="text-sm font-medium">Arbeitszeiten</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {workStartTime && (
                <div>
                  <span className="text-muted-foreground">Start:</span>
                  <div className="font-mono">{workStartTime}</div>
                </div>
              )}
              {workEndTime && (
                <div>
                  <span className="text-muted-foreground">Ende:</span>
                  <div className="font-mono">{workEndTime}</div>
                </div>
              )}
            </div>
            {totalHours && (
              <div className="text-sm font-medium text-primary">
                Gesamt: {totalHours}
              </div>
            )}
          </div>
        )}
        
        {status === 'active' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fortschritt</span>
              <span>{currentDay}/{estimatedDays} Tage</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentDay / estimatedDays) * 100}%` }}
              />
            </div>
          </div>
        )}

        {currentDay >= 7 && status === 'active' && (
          <div className="p-2 bg-warning/10 border border-warning/20 rounded-md">
            <p className="text-sm text-warning-foreground font-medium">
              ⚠️ Max. 7 Tage erreicht - Neue Datei wird erstellt
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onDetails}>
            Details
          </Button>
          <Button size="sm" className="flex-1" onClick={onEdit}>
            Bearbeiten
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};