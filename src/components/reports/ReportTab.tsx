import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save, FileText } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { DayReport } from '@/types/dayReport';
import { formatDayTitle } from '@/features/jobs/report/helpers';
import { useTranslation } from 'react-i18next';

interface ReportTabProps {
  job: Job;
  onJobUpdate: (updatedJob: Job) => void;
}

export const ReportTab = ({ job, onJobUpdate }: ReportTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  
  const reports = job.reports || [];
  const totalDays = job.estimatedDays || 1;

  // Load current day's text when day changes
  useEffect(() => {
    const report = reports.find(r => r.dayIndex === currentDayIndex);
    const text = report?.text || '';
    setCurrentText(text);
    setIsDirty(false);
  }, [currentDayIndex, reports]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (text: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSaveCurrentDay(text, true);
        }, 600);
      };
    })(),
    [currentDayIndex, reports]
  );

  // Auto-save when text changes
  useEffect(() => {
    if (isDirty) {
      debouncedAutoSave(currentText);
    }
  }, [currentText, isDirty, debouncedAutoSave]);

  const handleTextChange = (text: string) => {
    setCurrentText(text);
    setIsDirty(true);
  };

  const handleSaveCurrentDay = async (text?: string, isAutoSave = false) => {
    const textToSave = text ?? currentText;
    
    // Update reports array
    const updatedReports = [...reports];
    const existingIndex = updatedReports.findIndex(r => r.dayIndex === currentDayIndex);
    
    const reportData: DayReport = {
      dayIndex: currentDayIndex,
      dateISO: job.days?.[currentDayIndex]?.date,
      text: textToSave
    };

    if (existingIndex >= 0) {
      updatedReports[existingIndex] = reportData;
    } else {
      updatedReports.push(reportData);
    }

    // Update job
    const updatedJob = { ...job, reports: updatedReports };
    onJobUpdate(updatedJob);
    setIsDirty(false);

    if (!isAutoSave) {
      toast({
        title: t('saved'),
        description: `Report für ${formatDayTitle(reportData, currentDayIndex)} gespeichert`,
      });
    }
  };

  const handlePreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const handleNextDay = () => {
    if (currentDayIndex < totalDays - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const handleDayClick = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveCurrentDay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentText]);

  const currentReport = reports.find(r => r.dayIndex === currentDayIndex);
  const dayTitle = formatDayTitle(currentReport || { dayIndex: currentDayIndex, text: '' }, currentDayIndex);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Day tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
            {Array.from({ length: totalDays }, (_, i) => {
              const report = reports.find(r => r.dayIndex === i);
              const isActive = i === currentDayIndex;
              const dayTitle = formatDayTitle(report || { dayIndex: i, text: '' }, i);
              
              return (
                <Button
                  key={i}
                  data-testid={`report-tab-${i}`}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDayClick(i)}
                  className={`rounded-xl px-3 py-1 whitespace-nowrap ${
                    isActive ? 'bg-slate-900 text-white' : ''
                  }`}
                >
                  {dayTitle}
                </Button>
              );
            })}
          </div>

          {/* Report textarea */}
          <div>
            <Textarea
              data-testid="report-textarea"
              placeholder={`Report für ${dayTitle}`}
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full min-h-[40vh] resize-vertical rounded-xl border p-3"
            />
          </div>

          {/* Footer controls */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <Button
              data-testid="report-prev"
              variant="outline"
              size="sm"
              onClick={handlePreviousDay}
              disabled={currentDayIndex === 0}
              title="Vorheriger Tag"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              data-testid="report-save"
              variant="default"
              size="sm"
              onClick={() => handleSaveCurrentDay()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Speichern
              {isDirty && <span className="text-xs">(•)</span>}
            </Button>

            <Button
              data-testid="report-next"
              variant="outline"
              size="sm"
              onClick={handleNextDay}
              disabled={currentDayIndex === totalDays - 1}
              title="Nächster Tag"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};