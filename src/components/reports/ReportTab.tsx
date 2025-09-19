import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save, FileText, CalendarIcon } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { DayReport } from '@/types/dayReport';
import { formatDayTitle } from '@/features/jobs/report/helpers';
import { useTranslation } from 'react-i18next';
import { format } from "date-fns/format";
import { cn } from "@/lib/utils";

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
  const estimated = job.estimatedDays || 1;
  const totalDays = Math.max(job.days?.length || 0, reports.length || 0, estimated);

  console.log('ReportTab - totalDays:', totalDays, 'reports:', reports.length, 'job.days:', job.days?.length);

  // Prefer dates from time entries (days), fallback to report dates
  const dayDates: (string | undefined)[] = Array.from({ length: totalDays }, (_, i) => {
    const dayDate = job.days?.[i]?.date as string | undefined;
    const reportDate = reports.find(r => r.dayIndex === i)?.dateISO;
    return dayDate ?? reportDate;
  });

  console.log('ReportTab - dayDates:', dayDates);

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

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;

    const dateISO = format(date, 'yyyy-MM-dd');
    
    // Update reports array with new date
    const updatedReports = [...reports];
    const existingIndex = updatedReports.findIndex(r => r.dayIndex === currentDayIndex);
    
    const reportData: DayReport = {
      dayIndex: currentDayIndex,
      dateISO: dateISO,
      text: currentText
    };

    if (existingIndex >= 0) {
      updatedReports[existingIndex] = reportData;
    } else {
      updatedReports.push(reportData);
    }

    // Update job
    const updatedJob = { ...job, reports: updatedReports };
    onJobUpdate(updatedJob);

    toast({
      title: 'Datum aktualisiert',
      description: `Datum für Tag ${currentDayIndex + 1} auf ${format(date, 'dd.MM.yyyy')} gesetzt`,
    });
  };

  const handleSaveCurrentDay = async (text?: string, isAutoSave = false) => {
    const textToSave = text ?? currentText;
    
    // Update reports array
    const updatedReports = [...reports];
    const existingIndex = updatedReports.findIndex(r => r.dayIndex === currentDayIndex);
    
    const existing = reports.find(r => r.dayIndex === currentDayIndex);
    const reportData: DayReport = {
      dayIndex: currentDayIndex,
      dateISO: existing?.dateISO ?? job.days?.[currentDayIndex]?.date,
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
        title: t('report.saved'),
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
            {t('report.tab')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Day tabs derived from days (time entries) with fallback to reports */}
          <div className="flex gap-2 mb-3 overflow-x-auto border border-muted-foreground/20 p-2 rounded-lg" style={{ scrollbarWidth: 'thin' }}>
            <div className="text-xs text-muted-foreground mb-2">Arbeitstage ({totalDays}):</div>
            {Array.from({ length: totalDays }, (_, i) => {
              const isActive = i === currentDayIndex;
              const dateStr = dayDates[i];
              const label = `Tag ${i + 1}`;
              
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
                  {label}
                </Button>
              );
            })}
          </div>

          {/* Date picker for current day */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium">Datum für {dayTitle}:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !dayDates[currentDayIndex] && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dayDates[currentDayIndex] ? (
                    format(new Date(dayDates[currentDayIndex] as string), "dd.MM.yyyy")
                  ) : (
                    <span>Datum wählen</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dayDates[currentDayIndex] ? new Date(dayDates[currentDayIndex] as string) : undefined}
                  onSelect={handleDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Report textarea */}
          <div>
            <Textarea
              data-testid="report-textarea"
              placeholder={`Bericht für ${currentReport?.dateISO 
                ? dayTitle 
                : `Tag ${currentDayIndex + 1}/${totalDays}`}...`}
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full min-h-[40vh] resize-vertical rounded-xl border p-3"
            />
          </div>

          {/* Footer controls */}
          <TooltipProvider>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    data-testid="report-prev"
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousDay}
                    disabled={currentDayIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('report.prev')}</TooltipContent>
              </Tooltip>

              <Button
                data-testid="report-save"
                variant="default"
                size="sm"
                onClick={() => handleSaveCurrentDay()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {t('report.save')}
                {isDirty && <span className="text-xs">(•)</span>}
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    data-testid="report-next"
                    variant="outline"
                    size="sm"
                    onClick={handleNextDay}
                    disabled={currentDayIndex === totalDays - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('report.next')}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
};