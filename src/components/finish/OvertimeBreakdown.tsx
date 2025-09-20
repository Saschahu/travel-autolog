import { Calculator } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { splitOvertime, generatePayableFormula, decimalHoursToMinutes } from '@/lib/overtimeCalc';
import { formatHours } from '@/lib/timeCalc';
import type { OvertimeCalculation } from '@/types/overtime';

interface OvertimeBreakdownProps {
  calculation: OvertimeCalculation;
}

export const OvertimeBreakdown = ({ calculation }: OvertimeBreakdownProps) => {
  const { t } = useTranslation();
  const { overtimeSettings } = useOvertimeCalculation();
  
  const formatDecimalHours = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    return formatHours(totalMinutes);
  };
  
  // Calculate splits for display
  const ot50Minutes = decimalHoursToMinutes(calculation.overtime1Hours);
  const ot100Minutes = decimalHoursToMinutes(calculation.overtime2Hours);
  const saturdayMinutes = decimalHoursToMinutes(calculation.saturdayHours);
  const sundayMinutes = decimalHoursToMinutes(calculation.sundayHours);
  const regularMinutes = decimalHoursToMinutes(calculation.regularHours);
  
  const splits = splitOvertime(ot50Minutes, ot100Minutes, saturdayMinutes, sundayMinutes, overtimeSettings);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Überstunden-Berechnung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Regular and Overtime Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Regulär</div>
            <div className="text-lg font-semibold">
              {formatDecimalHours(calculation.regularHours)}
            </div>
          </div>
          
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
        </div>

        {/* Weekend Hours */}
        {(splits.saturdaySplit || splits.sundaySplit) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        )}

        {/* Breakdown Details */}
        {calculation.overtimeBreakdown.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Aufschlüsselung:</h4>
            <div className="space-y-2">
              {calculation.overtimeBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-secondary/30 rounded">
                  <span className="text-sm">
                    {item.type} ({item.rate}%)
                  </span>
                   <div className="text-right">
                     <div className="font-medium">{formatDecimalHours(item.hours)}</div>
                     <div className="text-xs text-muted-foreground">
                       Zuschlag: {item.amount.toFixed(2)}h
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Garantierte Stunden:</span>
            <span>{formatDecimalHours(calculation.guaranteedHours)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Basis (Rohzeit):</span>
            <span>{formatDecimalHours(calculation.actualWorkedHours)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Zuschläge:</span>
            <span>{formatDecimalHours(calculation.totalOvertimeAmount)}</span>
          </div>
          <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
            <span>Abrechnungsstunden gesamt:</span>
            <span className="text-primary">{formatDecimalHours(calculation.totalPayableHours)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {generatePayableFormula(regularMinutes, splits, t)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};