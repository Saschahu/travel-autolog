import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save, FileText, CalendarIcon } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { DayReport } from '@/types/dayReport';
import { formatDayTitle, buildReportSummary } from '@/features/jobs/report/helpers';
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ReportEditor, ReportMode } from '@/components/report/ReportEditor';

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
  
  // New state for rich-text mode
  const [reportMode, setReportMode] = useState<ReportMode>((job.reportMode as ReportMode) || 'daily');
  const [isRichTextMode, setIsRichTextMode] = useState(false); // Toggle between plain text and rich text
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  
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

  // Mode switching logic
  const handleModeSwitch = (newMode: ReportMode) => {
    if (newMode === reportMode) return;

    const updatedJob = { ...job };

    if (reportMode === 'daily' && newMode === 'aggregate') {
      // daily → aggregate: concatenate all daily reports
      if (isRichTextMode) {
        // TODO: Implement rich text concatenation
        // For now, use placeholder
        const aggregateContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Aggregated content placeholder' }] }] };
        updatedJob.aggregateDoc = aggregateContent;
      } else {
        // Plain text concatenation
        const aggregateText = reports
          .sort((a, b) => a.dayIndex - b.dayIndex)
          .map((report, i) => {
            const title = formatDayTitle(report, i);
            return `${title}\n${(report.text || '').trim()}`;
          })
          .join('\n\n');
        
        setCurrentText(aggregateText);
      }
    } else if (reportMode === 'aggregate' && newMode === 'daily') {
      // aggregate → daily: keep existing daily docs, don't overwrite
      // If dailyDocs is empty, create placeholders
      if (isRichTextMode && !job.dailyDocs) {
        const placeholderDocs: Record<string, any> = {};
        dayDates.forEach((dateISO, i) => {
          if (dateISO) {
            placeholderDocs[dateISO] = { 
              type: 'doc', 
              content: [{ 
                type: 'paragraph', 
                content: [{ 
                  type: 'text', 
                  text: `Bericht für ${formatDayTitle({ dayIndex: i, text: '', dateISO }, i)} (Hinweis: Von Gesamtbericht hierher wechseln - neue leere Dokumente)` 
                }] 
              }] 
            };
          }
        });
        updatedJob.dailyDocs = placeholderDocs;
      }
    }

    updatedJob.reportMode = newMode;
    setReportMode(newMode);
    onJobUpdate(updatedJob);

    toast({
      title: 'Modus gewechselt',
      description: `Zu ${newMode === 'daily' ? 'Tagesberichten' : 'Gesamtbericht'} gewechselt`,
    });
  };

  // Handle rich text editor changes
  const handleRichTextChange = (doc: any) => {
    setCurrentDoc(doc);
    setIsDirty(true);
    
    // TODO: Implement proper persistence
    // For now, just save to job state
    const updatedJob = { ...job };
    
    if (reportMode === 'daily') {
      const currentDate = dayDates[currentDayIndex];
      if (currentDate) {
        updatedJob.dailyDocs = {
          ...updatedJob.dailyDocs,
          [currentDate]: doc
        };
      }
    } else {
      updatedJob.aggregateDoc = doc;
    }
    
    onJobUpdate(updatedJob);
  };

  // Load current day's text when day changes
  useEffect(() => {
    if (isRichTextMode) {
      if (reportMode === 'daily') {
        const currentDate = dayDates[currentDayIndex];
        if (currentDate && job.dailyDocs?.[currentDate]) {
          setCurrentDoc(job.dailyDocs[currentDate]);
        } else {
          // Create placeholder doc
          setCurrentDoc({ 
            type: 'doc', 
            content: [{ type: 'paragraph' }] 
          });
        }
      } else {
        setCurrentDoc(job.aggregateDoc || { type: 'doc', content: [{ type: 'paragraph' }] });
      }
    } else {
      if (reportMode === 'daily') {
        const report = reports.find(r => r.dayIndex === currentDayIndex);
        const text = report?.text || '';
        setCurrentText(text);
      } else {
        // For aggregate mode in plain text, build summary
        const aggregateText = buildReportSummary(reports);
        setCurrentText(aggregateText);
      }
    }
    setIsDirty(false);
  }, [currentDayIndex, reports, reportMode, isRichTextMode, job.dailyDocs, job.aggregateDoc, dayDates]);

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
          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="report-mode"
                  checked={reportMode === 'aggregate'}
                  onCheckedChange={(checked) => handleModeSwitch(checked ? 'aggregate' : 'daily')}
                />
                <Label htmlFor="report-mode">
                  {reportMode === 'daily' ? 'Tagesberichte' : 'Gesamtbericht'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="rich-text-mode"
                  checked={isRichTextMode}
                  onCheckedChange={setIsRichTextMode}
                />
                <Label htmlFor="rich-text-mode">
                  Rich-Text Editor
                </Label>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {reportMode === 'daily' 
                ? `Aktuell: Tag ${currentDayIndex + 1}/${totalDays}` 
                : 'Gesamter Zeitraum'}
            </div>
          </div>

          {/* Day tabs - only show in daily mode */}
          {reportMode === 'daily' && (
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
          )}

          {/* Date picker for current day - only show in daily mode */}
          {reportMode === 'daily' && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium">Datum für {formatDayTitle(currentReport || { dayIndex: currentDayIndex, text: '' }, currentDayIndex)}:</span>
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
          )}

          {/* Editor */}
          <div>
            {isRichTextMode ? (
              <ReportEditor
                mode={reportMode}
                value={currentDoc}
                onChange={handleRichTextChange}
                className="w-full"
              />
            ) : (
              <Textarea
                data-testid="report-textarea"
                placeholder={`Bericht für ${reportMode === 'daily' 
                  ? (currentReport?.dateISO 
                    ? formatDayTitle(currentReport, currentDayIndex) 
                    : `Tag ${currentDayIndex + 1}/${totalDays}`)
                  : 'den gesamten Zeitraum'}...`}
                value={currentText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full min-h-[40vh] resize-vertical rounded-xl border p-3"
              />
            )}
          </div>

          {/* Footer controls - only show relevant controls based on mode */}
          <TooltipProvider>
            <div className="mt-3 flex items-center justify-between gap-3">
              {reportMode === 'daily' && (
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
              )}

              <Button
                data-testid="report-save"
                variant="default"
                size="sm"
                onClick={() => isRichTextMode ? console.log('Rich text save - TODO') : handleSaveCurrentDay()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {t('report.save')}
                {isDirty && <span className="text-xs">(•)</span>}
              </Button>

              {reportMode === 'daily' && (
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
              )}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
};