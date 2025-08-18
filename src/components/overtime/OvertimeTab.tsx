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
              <div className="text-sm text-muted-foreground">Garantierte Stunden</div>
              <div className="font-mono text-lg font-semibold text-primary">{overtimeCalculation.guaranteedHours}h</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Tatsächlich gearbeitet</div>
              <div className="font-mono text-lg">{overtimeCalculation.actualWorkedHours.toFixed(2)}h</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Kernarbeitszeit (8-16h)</div>
              <div className="font-mono text-lg">{overtimeCalculation.coreHours.toFixed(2)}h</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Überstunden</div>
              <div className="font-mono text-lg text-orange-600">{overtimeCalculation.overtimeHours.toFixed(2)}h</div>
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
          {/* Regular vs Overtime Hours */}
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
            <div className="text-sm">Kernarbeitszeit (8-16 Uhr)</div>
            <div className="font-mono">{overtimeCalculation.coreHours.toFixed(2)}h</div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm text-orange-800">Überstunden (außerhalb 8-16 Uhr)</div>
            <div className="font-mono text-orange-800">{overtimeCalculation.overtimeHours.toFixed(2)}h</div>
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
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-800">Bezahlbare Stunden</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-blue-800">
                  {overtimeCalculation.totalPayableHours.toFixed(2)}h
                </div>
                <div className="font-mono text-sm text-blue-600">
                  ({overtimeCalculation.guaranteedHours}h + {overtimeCalculation.totalAmount.toFixed(2)}h Zuschlag)
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>Erklärung:</strong> Sie erhalten mindestens {overtimeCalculation.guaranteedHours} Stunden bezahlt, 
              auch wenn Sie weniger arbeiten. Alle Stunden außerhalb 8-16 Uhr sind Überstunden mit Zuschlag.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};