import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { TimeEntry } from '@/lib/timeCalc';
import { OvertimeCalculation } from '@/types/overtime';
import { renderReportElement } from '@/components/reports/renderReport';
import { useSettingsStore } from '@/state/settingsStore';
import { createRoot } from 'react-dom/client';

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
  const getReportLang = useSettingsStore(state => state.getReportLang);
  const [reportElement, setReportElement] = useState<React.ReactElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (open) {
      const lang = getReportLang();
      setIsLoading(true);
      
      renderReportElement({
        job,
        workReport,
        timeEntries,
        totalMinutes,
        overtimeCalculation
      }, lang).then(({ element }) => {
        setReportElement(element);
        setIsLoading(false);
      }).catch((error) => {
        console.error('Failed to render report:', error);
        setIsLoading(false);
      });
    }
  }, [open, job, workReport, timeEntries, totalMinutes, overtimeCalculation, getReportLang]);
  
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = 'Arbeitsbericht';
    window.print();
    document.title = originalTitle;
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
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading report...</div>
            </div>
          ) : reportElement ? (
            <div className="a4-page-container">
              {reportElement}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Failed to load report</div>
            </div>
          )}
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
          
          .a4-page-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          @media print {
            .a4-page, .a4-page-container {
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