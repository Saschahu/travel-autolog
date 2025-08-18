import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { Job } from '@/hooks/useJobs';

interface JobStatusCardProps extends Job {
  onDetails?: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
  onDelete?: (id: string) => void;
}

export const JobStatusCard = (props: JobStatusCardProps) => {
  const { 
    id,
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
    onComplete,
    onDelete,
    ...job
  } = props;
  
  const { calculateTimeBreakdown, formatMinutesToHours } = useOvertimeCalculation();
  const getStatusIcon = () => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed-sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'open':
        return 'outline';
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'completed-sent':
        return 'secondary';
      case 'pending':
        return 'outline';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'active':
        return 'Aktiv';
      case 'completed':
        return 'Abgeschlossen';
      case 'completed-sent':
        return 'Abgeschlossen & Gesendet';
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
            {/* Time breakdown display */}
            <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
              {(() => {
                const timeBreakdown = calculateTimeBreakdown(job as Job);
                const formatTime = (minutes: number) => {
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  return `${hours}h ${mins}m`;
                };
                
                return (
                  <>
                    <div>
                      <span className="text-muted-foreground">Anreise:</span>
                      <div className="font-mono">{formatTime(timeBreakdown.travelTime)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Arbeit:</span>
                      <div className="font-mono">{formatTime(timeBreakdown.workTime)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Abreise:</span>
                      <div className="font-mono">{formatTime(timeBreakdown.departureTime)}</div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="text-sm font-medium text-primary border-t pt-2">
              Gesamt: {(() => {
                const timeBreakdown = calculateTimeBreakdown(job as Job);
                const totalMinutes = timeBreakdown.travelTime + timeBreakdown.workTime + timeBreakdown.departureTime;
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                return `${hours}h ${mins}m`;
              })()}
            </div>
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
          {status === 'completed' && onComplete && (
            <Button size="sm" variant="secondary" onClick={onComplete}>
              Report senden
            </Button>
          )}
          {onDelete && (
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onDelete(id)}
              className="px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};