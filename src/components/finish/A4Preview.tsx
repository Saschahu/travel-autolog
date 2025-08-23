import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { TimeEntry, formatHours } from '@/lib/timeCalc';
import { OvertimeCalculation } from '@/types/overtime';

interface A4PreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  workReport: string;
  timeEntries: TimeEntry[];
  totalMinutes: number;
  overtimeCalculation: OvertimeCalculation;
}

export const A4Preview = ({ 
  open, 
  onOpenChange, 
  job, 
  workReport, 
  timeEntries, 
  totalMinutes,
  overtimeCalculation 
}: A4PreviewProps) => {
  
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE');
    } catch {
      return dateStr;
    }
  };

  const formatDecimalHours = (hours: number): string => {
    const totalMins = Math.round(hours * 60);
    return formatHours(totalMins);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'travel': return 'Anreise';
      case 'work': return 'Arbeitszeit'; 
      case 'departure': return 'Abreise';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            Report Vorschau
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* A4 Container */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] print:overflow-visible print:max-h-none">
          <div className="a4-page bg-white text-black print:shadow-none print:w-auto print:min-h-0 print:m-0">
            {/* Header */}
            <div className="header mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ServiTracker</h1>
                  <p className="text-gray-600">Arbeitsbericht</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Erstellt am: {new Date().toLocaleDateString('de-DE')}</p>
                  <p>Job-ID: {job.id.slice(0, 8)}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-300 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-semibold">Kunde:</span> {job.customerName}</p>
                    <p><span className="font-semibold">Adresse:</span> {job.customerAddress || 'Nicht angegeben'}</p>
                    <p><span className="font-semibold">EVATIC Nr.:</span> {job.evaticNo || 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold">Hersteller:</span> {job.manufacturer || 'Nicht angegeben'}</p>
                    <p><span className="font-semibold">Modell:</span> {job.model || 'Nicht angegeben'}</p>
                    <p><span className="font-semibold">Seriennummer:</span> {job.serialNumber || 'Nicht angegeben'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Entries Table */}
            <div className="section mb-6">
              <h2 className="text-lg font-bold mb-3 text-gray-900">Arbeitszeiten</h2>
              {timeEntries.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left">Datum</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Typ</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Von</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Bis</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Pause</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Dauer</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Notiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map((entry) => {
                      const rawMinutes = entry.end && entry.start ? 
                        (new Date(`2000-01-01T${entry.end}:00`).getTime() - new Date(`2000-01-01T${entry.start}:00`).getTime()) / (1000 * 60) : 0;
                      const workMinutes = Math.max(0, rawMinutes - (entry.breakMinutes || 0));
                      
                      return (
                        <tr key={entry.id}>
                          <td className="border border-gray-300 px-2 py-1">{formatDate(entry.date)}</td>
                          <td className="border border-gray-300 px-2 py-1">{getTypeLabel(entry.type)}</td>
                          <td className="border border-gray-300 px-2 py-1">{entry.start}</td>
                          <td className="border border-gray-300 px-2 py-1">{entry.end}</td>
                          <td className="border border-gray-300 px-2 py-1">{entry.breakMinutes || 0} Min</td>
                          <td className="border border-gray-300 px-2 py-1 font-medium">{formatHours(workMinutes)}</td>
                          <td className="border border-gray-300 px-2 py-1">{entry.note || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={5} className="border border-gray-300 px-2 py-1 text-right">Gesamtstunden:</td>
                      <td className="border border-gray-300 px-2 py-1">{formatHours(totalMinutes)}</td>
                      <td className="border border-gray-300 px-2 py-1"></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="text-gray-600">Keine Zeiteinträge vorhanden.</p>
              )}
            </div>

            {/* Overtime Breakdown */}
            <div className="section mb-6">
              <h2 className="text-lg font-bold mb-3 text-gray-900">Überstunden-Aufschlüsselung</h2>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div className="border border-gray-300 p-2 text-center">
                  <div className="font-semibold">Regulär</div>
                  <div>{formatDecimalHours(overtimeCalculation.regularHours)}</div>
                </div>
                <div className="border border-gray-300 p-2 text-center">
                  <div className="font-semibold">Überstunden 50%</div>
                  <div>{formatDecimalHours(overtimeCalculation.overtime1Hours)}</div>
                </div>
                <div className="border border-gray-300 p-2 text-center">
                  <div className="font-semibold">Überstunden 100%</div>
                  <div>{formatDecimalHours(overtimeCalculation.overtime2Hours)}</div>
                </div>
              </div>
              
              {(overtimeCalculation.saturdayHours > 0 || overtimeCalculation.sundayHours > 0) && (
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="border border-gray-300 p-2 text-center">
                    <div className="font-semibold">Samstag (50%)</div>
                    <div>{formatDecimalHours(overtimeCalculation.saturdayHours)}</div>
                  </div>
                  <div className="border border-gray-300 p-2 text-center">
                    <div className="font-semibold">Sonntag/Feiertag (100%)</div>
                    <div>{formatDecimalHours(overtimeCalculation.sundayHours)}</div>
                  </div>
                </div>
              )}
              
              <div className="border border-gray-300 p-3 bg-gray-50 font-bold text-center">
                Abrechnungsstunden gesamt: {formatDecimalHours(overtimeCalculation.totalPayableHours)}
              </div>
            </div>

            {/* Work Report */}
            <div className="section mb-6">
              <h2 className="text-lg font-bold mb-3 text-gray-900">Arbeitsbericht</h2>
              <div className="border border-gray-300 p-3 bg-gray-50 min-h-[100px] whitespace-pre-wrap text-sm">
                {workReport || 'Kein Arbeitsbericht verfasst.'}
              </div>
            </div>

            {/* Signature Section */}
            <div className="section mt-8">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Unterschriften</h2>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Techniker</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Datum: _________________</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Kunde</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Datum: _________________</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            page-break-after: always;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          @media print {
            .a4-page {
              width: auto;
              min-height: auto;
              margin: 0;
              padding: 0;
              box-shadow: none;
              page-break-after: auto;
            }
            
            .section {
              page-break-inside: avoid;
            }
            
            table {
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `
      }} />
    </Dialog>
  );
};