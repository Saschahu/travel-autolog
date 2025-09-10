import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calculator, TrendingUp, RefreshCw } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { useTranslation } from 'react-i18next';
import { formatHours } from '@/lib/timeCalc';
import { splitOvertime, generatePayableFormula, decimalHoursToMinutes } from '@/lib/overtimeCalc';
import { useMemo } from 'react';

interface OvertimeTabProps {
  job: Job;
}

export const OvertimeTab = ({ job }: OvertimeTabProps) => {
  const { t } = useTranslation();
  const { calculateOvertime, calculateTimeBreakdown, formatMinutesToHours, overtimeSettings, forceRecalculation, recalcTrigger } = useOvertimeCalculation();
  
  const timeBreakdown = useMemo(() => calculateTimeBreakdown(job), [job, calculateTimeBreakdown, recalcTrigger]);
  const overtimeCalculation = useMemo(() => calculateOvertime(job), [job, calculateOvertime, recalcTrigger]);
  
  // Calculate splits for display
  const ot50Minutes = decimalHoursToMinutes(overtimeCalculation.overtime1Hours);
  const ot100Minutes = decimalHoursToMinutes(overtimeCalculation.overtime2Hours);
  const saturdayMinutes = decimalHoursToMinutes(overtimeCalculation.saturdayHours);
  const sundayMinutes = decimalHoursToMinutes(overtimeCalculation.sundayHours);
  const regularMinutes = decimalHoursToMinutes(overtimeCalculation.regularHours);
  
  const splits = splitOvertime(ot50Minutes, ot100Minutes, saturdayMinutes, sundayMinutes, overtimeSettings);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatHoursToStdMin = (decimalHours: number) => {
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours} Std ${mins} Min`;
  };

  return (
    <div className="space-y-6">
      {/* Recalculate Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={forceRecalculation}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Neu berechnen
        </Button>
      </div>
      
      {/* Time Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('timeBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('guaranteedHours')}</div>
              <div className="font-mono text-lg font-semibold text-primary">{overtimeCalculation.guaranteedHours}h</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('actualWorked')}</div>
              <div className="font-mono text-lg">{formatHoursToStdMin(overtimeCalculation.actualWorkedHours)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('regularHours')}</div>
              <div className="font-mono text-lg">{overtimeCalculation.regularHours.toFixed(2)}h</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('overtimeHours')}</div>
              <div className="font-mono text-lg text-orange-600">{overtimeCalculation.totalOvertimeHours.toFixed(2)}h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t('overtimeCalculation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Regular vs Overtime Hours */}
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
            <div className="text-sm">{t('regularHoursUpTo8')}</div>
            <div className="font-mono">{overtimeCalculation.regularHours.toFixed(2)}h</div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm text-orange-800">{t('totalOvertime')}</div>
            <div className="font-mono text-orange-800">{overtimeCalculation.totalOvertimeHours.toFixed(2)}h</div>
          </div>

          {/* Overtime Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {splits.ot50Split && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <div className="text-sm text-muted-foreground mb-2">
                  Überstunden 8–12h ({splits.ot50Split.rate}%)
                </div>
                <div className="text-lg font-semibold text-orange-600 mb-1">
                  {formatHours(splits.ot50Split.baseMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">
                  +{formatHours(splits.ot50Split.surchargeMinutes)} {t('overtime.surcharge')} • ={formatHours(splits.ot50Split.creditMinutes)} {t('overtime.credit')}
                </div>
              </div>
            )}
            
            {splits.ot100Split && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="text-sm text-muted-foreground mb-2">
                  Überstunden über 12h ({splits.ot100Split.rate}%)
                </div>
                <div className="text-lg font-semibold text-red-600 mb-1">
                  {formatHours(splits.ot100Split.baseMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">
                  +{formatHours(splits.ot100Split.surchargeMinutes)} {t('overtime.surcharge')} • ={formatHours(splits.ot100Split.creditMinutes)} {t('overtime.credit')}
                </div>
              </div>
            )}
            
            {splits.saturdaySplit && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="text-sm text-muted-foreground mb-2">
                  Samstag ({splits.saturdaySplit.rate}%)
                </div>
                <div className="text-lg font-semibold text-blue-600 mb-1">
                  {formatHours(splits.saturdaySplit.baseMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">
                  +{formatHours(splits.saturdaySplit.surchargeMinutes)} {t('overtime.surcharge')} • ={formatHours(splits.saturdaySplit.creditMinutes)} {t('overtime.credit')}
                </div>
              </div>
            )}
            
            {splits.sundaySplit && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <div className="text-sm text-muted-foreground mb-2">
                  Sonntag/Feiertag ({splits.sundaySplit.rate}%)
                </div>
                <div className="text-lg font-semibold text-purple-600 mb-1">
                  {formatHours(splits.sundaySplit.baseMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">
                  +{formatHours(splits.sundaySplit.surchargeMinutes)} {t('overtime.surcharge')} • ={formatHours(splits.sundaySplit.creditMinutes)} {t('overtime.credit')}
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-800">{t('payableHours')}</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-blue-800">
                  {formatHours(decimalHoursToMinutes(overtimeCalculation.totalPayableHours))}
                </div>
                <div className="font-mono text-xs text-blue-600 mt-1">
                  {generatePayableFormula(regularMinutes, splits, t)}
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>{t('overtimeExplanation')}</strong> {overtimeCalculation.guaranteedHours} {t('hoursMinimum')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};