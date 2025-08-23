import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { OvertimeCalculation } from '@/types/overtime';
import { formatHours } from '@/lib/timeCalc';

interface OvertimeBreakdownProps {
  calculation: OvertimeCalculation;
}

export const OvertimeBreakdown = ({ calculation }: OvertimeBreakdownProps) => {
  const formatDecimalHours = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    return formatHours(totalMinutes);
  };

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
          
          {calculation.overtime1Hours > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">
                Überstunden 50% (x1.5)
              </div>
              <div className="text-lg font-semibold text-orange-600">
                {formatDecimalHours(calculation.overtime1Hours)}
              </div>
            </div>
          )}
          
          {calculation.overtime2Hours > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">
                Überstunden 100% (x2.0)
              </div>
              <div className="text-lg font-semibold text-red-600">
                {formatDecimalHours(calculation.overtime2Hours)}
              </div>
            </div>
          )}
        </div>

        {/* Weekend Hours */}
        {(calculation.saturdayHours > 0 || calculation.sundayHours > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {calculation.saturdayHours > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">
                  Samstag (50%)
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatDecimalHours(calculation.saturdayHours)}
                </div>
              </div>
            )}
            
            {calculation.sundayHours > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">
                  Sonntag/Feiertag (100%)
                </div>
                <div className="text-lg font-semibold text-purple-600">
                  {formatDecimalHours(calculation.sundayHours)}
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
                      Faktor: {item.amount.toFixed(2)}h
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
            <span className="text-muted-foreground">Tatsächlich gearbeitet:</span>
            <span>{formatDecimalHours(calculation.actualWorkedHours)}</span>
          </div>
          <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
            <span>Abrechnungsstunden gesamt:</span>
            <span className="text-primary">{formatDecimalHours(calculation.totalPayableHours)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};