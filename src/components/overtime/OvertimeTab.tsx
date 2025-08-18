import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calculator, TrendingUp } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';

interface OvertimeTabProps {
  job: Job;
}

export const OvertimeTab = ({ job }: OvertimeTabProps) => {
  const { calculateOvertime, calculateTimeBreakdown, formatMinutesToHours } = useOvertimeCalculation();
  
  const timeBreakdown = calculateTimeBreakdown(job);
  const overtimeCalculation = calculateOvertime(job);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Time Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Zeitaufschlüsselung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Anreisezeit</div>
              <div className="font-mono text-lg">{formatTime(timeBreakdown.travelTime)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Arbeitszeit</div>
              <div className="font-mono text-lg">{formatTime(timeBreakdown.workTime)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Abreisezeit</div>
              <div className="font-mono text-lg">{formatTime(timeBreakdown.departureTime)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Gesamtzeit</div>
              <div className="font-mono text-lg font-semibold text-primary">
                {formatTime(timeBreakdown.travelTime + timeBreakdown.workTime + timeBreakdown.departureTime)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Überstundenzuschläge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Regular Hours */}
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
            <div className="text-sm">Normalstunden</div>
            <div className="font-mono">{overtimeCalculation.regularHours.toFixed(2)}h</div>
          </div>

          {/* Overtime Slots */}
          <div className="space-y-2">
            {overtimeCalculation.overtimeSlots.map((slot) => (
              <div key={slot.slotId} className="flex justify-between items-center p-3 border rounded-md">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{slot.name}</div>
                  <Badge variant={slot.isWeekend ? "default" : "secondary"}>
                    {slot.rate}% Zuschlag {slot.isWeekend && "• Wochenende"}
                  </Badge>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono text-sm">{slot.hours.toFixed(2)}h</div>
                  <div className="font-mono text-sm text-muted-foreground">
                    +{slot.amount.toFixed(2)}h
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold">Gesamt mit Zuschlägen</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-primary">
                  {(overtimeCalculation.regularHours + overtimeCalculation.totalAmount).toFixed(2)}h
                </div>
                <div className="font-mono text-sm text-muted-foreground">
                  (+{overtimeCalculation.totalAmount.toFixed(2)}h Zuschlag)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};