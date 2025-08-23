import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/useEmailService';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { FileCheck, Mail, Eye, LayoutDashboard, Save } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useNavigate } from 'react-router-dom';
import { TimeEntriesTable } from './TimeEntriesTable';
import { OvertimeBreakdown } from './OvertimeBreakdown';
import { A4Preview } from './A4Preview';
import { DayTypeBadge } from '@/components/ui/day-type-badge';
import { TimeEntryOverrides } from '@/components/time/TimeEntryOverrides';
import { useDayTypeDetection } from '@/hooks/useDayTypeDetection';
import { DayOverrides } from '@/lib/holidays';
import { extractTimeEntriesFromJob, calculateTotalHoursFromEntries } from '@/lib/timeCalc';
import { shareReportWithAttachment, canShareFiles } from '@/lib/shareWithEmail';
import { getOrBuildReportPdf, clearReportPdfCache, generateReportFilename } from '@/lib/reportPdf';
import { ShareFallbackModal } from './ShareFallbackModal';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useTranslation } from 'react-i18next';
import { tt } from '@/lib/i18nSafe';
import { isFileSystemAccessSupported, writeFile, getDirectoryName } from '@/lib/fsAccess';
import { loadExportHandle } from '@/lib/fsStore';
import { getReportFileName } from '@/lib/reportFileName';
import { saveReportDraft, loadReportDraft, clearReportDraft } from '@/lib/drafts';

interface FinishJobTabProps {
  job: Job;
  onJobUpdate: (updatedJob: Job) => void;
  onCloseDialog?: () => void;
}

export const FinishJobTab = ({ job, onJobUpdate, onCloseDialog }: FinishJobTabProps) => {
  const [workReport, setWorkReport] = useState(job.workReport || '');
  const [isSaved, setIsSaved] = useState(!!job.workReport);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<string>('');
  const [dayOverrides, setDayOverrides] = useState<Record<string, DayOverrides>>({});
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackFile, setFallbackFile] = useState<File | undefined>();
  const [isPdfReady, setIsPdfReady] = useState(false);
  
  const { toast } = useToast();
  const { sendJobReport } = useEmailService();
  const { generateJobExcel } = useExcelExport();
  const navigate = useNavigate();
  const { detectDayType } = useDayTypeDetection();
  const { profile } = useUserProfile();
  const { t } = useTranslation();

  const { calculateOvertime } = useOvertimeCalculation();

  // Debounced auto-save function
  const debouncedSaveDraft = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (text: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (text !== (job.workReport || '')) {
            try {
              await saveReportDraft(job.id, {
                text,
                updatedAt: new Date().toISOString()
              });
            } catch (error) {
              console.warn('Failed to save draft:', error);
            }
          }
        }, 600);
      };
    })(),
    [job.id, job.workReport]
  );

  // Load draft on mount and check if restore is needed
  useEffect(() => {
    const checkForDraft = async () => {
      try {
        const draft = await loadReportDraft(job.id);
        if (draft && draft.text !== (job.workReport || '') && draft.text.trim() !== '') {
          setDraftToRestore(draft.text);
          setShowRestoreDialog(true);
        }
      } catch (error) {
        console.warn('Failed to load draft:', error);
      }
    };
    
    checkForDraft();
  }, [job.id, job.workReport]);

  // Auto-save when workReport changes
  useEffect(() => {
    if (workReport !== (job.workReport || '')) {
      debouncedSaveDraft(workReport);
    }
  }, [workReport, debouncedSaveDraft, job.workReport]);

  // Auto-save before navigation
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (workReport !== (job.workReport || '')) {
        try {
          await saveReportDraft(job.id, {
            text: workReport,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Failed to save draft on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [job.id, workReport, job.workReport]);

  // Restore draft handlers
  const handleRestoreDraft = () => {
    setWorkReport(draftToRestore);
    setShowRestoreDialog(false);
    setDraftToRestore('');
    toast({
      title: t('saved'),
      description: 'Entwurf wurde wiederhergestellt',
    });
  };

  const handleDiscardDraft = async () => {
    try {
      await clearReportDraft(job.id);
      setShowRestoreDialog(false);
      setDraftToRestore('');
      toast({
        title: t('saved'),
        description: 'Entwurf wurde verworfen',
      });
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  };

  // Calculate time entries and totals
  const timeEntries = useMemo(() => extractTimeEntriesFromJob(job), [job]);
  const { totalMinutes, totalBreakMinutes } = useMemo(() => 
    calculateTotalHoursFromEntries(timeEntries), [timeEntries]
  );
  
  // Calculate overtime
  const overtimeCalculation = useMemo(() => calculateOvertime(job), [job, calculateOvertime]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = workReport !== (job.workReport || '');

  // Prepare PDF in the background when tab is opened
  useEffect(() => {
    const prepareReport = async () => {
      try {
        setIsPdfReady(false);
        await getOrBuildReportPdf({
          job,
          workReport,
          timeEntries,
          totalMinutes,
          overtimeCalculation
        });
        setIsPdfReady(true);
      } catch (error) {
        console.error('Failed to prepare PDF:', error);
      }
    };
    
    prepareReport();
  }, [job.id, workReport, timeEntries.length, totalMinutes]);

  // Clear cache when work report changes
  useEffect(() => {
    clearReportPdfCache();
  }, [workReport]);

  const handleSaveWorkReport = async () => {
    try {
      const updatedJob = { ...job, workReport: workReport };
      onJobUpdate(updatedJob);
      setIsSaved(true);
      
      // Clear draft when successfully saved
      await clearReportDraft(job.id);
      
      // Clear PDF cache and prepare new one
      clearReportPdfCache();
      setIsPdfReady(false);
      
      toast({
        title: t('saved'),
        description: 'Arbeitsbericht wurde gespeichert',
      });

      // Prepare updated PDF
      setTimeout(async () => {
        try {
          await getOrBuildReportPdf({
            job: updatedJob,
            workReport,
            timeEntries,
            totalMinutes,
            overtimeCalculation
          });
          setIsPdfReady(true);
        } catch (error) {
          console.error('Failed to prepare updated PDF:', error);
        }
      }, 100);
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Fehler beim Speichern des Arbeitsberichts',
        variant: 'destructive',
      });
    }
  };

  const handleSendReport = async () => {
    setIsSending(true);
    try {
      // First save if there are unsaved changes
      let currentJob = job;
      if (hasUnsavedChanges) {
        currentJob = { ...job, workReport: workReport };
        onJobUpdate(currentJob);
        setIsSaved(true);
        
        // Clear draft when job is updated
        await clearReportDraft(job.id);
        
        // Clear cache and rebuild
        clearReportPdfCache();
        await getOrBuildReportPdf({
          job: currentJob,
          workReport,
          timeEntries,
          totalMinutes,
          overtimeCalculation
        });
      }

      // Try Web Share API first
      const reportData = {
        job: currentJob,
        workReport,
        timeEntries,
        totalMinutes,
        overtimeCalculation
      };

      const result = await shareReportWithAttachment(reportData);
      
      if (result.ok) {
        toast({
          title: 'Bericht gesendet',
          description: 'Der Auftragsbericht wurde erfolgreich per E-Mail versendet.',
        });
      } else {
        // Show fallback modal
        setFallbackFile(result.file);
        setShowFallbackModal(true);
      }
    } catch (error) {
      console.error('Error in handleSendReport:', error);
      toast({
        title: t('error'),
        description: 'Fehler beim Versenden des Berichts',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSavePdf = async () => {
    setIsSaving(true);
    try {
      toast({
        title: t('saving'),
        description: 'PDF wird erstellt...',
      });
      
      // Generate PDF with current report content
      const pdfBlob = await getOrBuildReportPdf({
        job,
        workReport,
        timeEntries,
        totalMinutes,
        overtimeCalculation
      });

      // Generate filename
      const fileName = getReportFileName(job);

      // Try to save to selected export folder
      if (isFileSystemAccessSupported()) {
        try {
          const handle = await loadExportHandle();
          if (handle) {
            await writeFile(handle, fileName, pdfBlob);
            const folderName = await getDirectoryName(handle);
            toast({
              title: t('pdfSaved'),
              description: `${t('savedTo', { folder: folderName })}`,
            });
            return;
          }
        } catch (fsError) {
          console.warn('File system access failed, falling back to download:', fsError);
        }
      }
      
      // Fallback: Browser download
      toast({
        title: t('needFolder'),
        description: 'Datei wird heruntergeladen...',
      });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: t('pdfSaved'),
        description: 'PDF wurde erfolgreich heruntergeladen.',
      });
      
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast({
        title: t('error'),
        description: t('failed'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewReport = () => {
    setIsPreviewOpen(true);
  };

  const handleGoDashboard = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onCloseDialog?.();
      navigate('/');
    }
  };

  const confirmGoToDashboard = async () => {
    // Auto-save before navigating
    if (hasUnsavedChanges) {
      try {
        await saveReportDraft(job.id, {
          text: workReport,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to save draft before navigation:', error);
      }
    }
    
    setShowConfirmDialog(false);
    onCloseDialog?.();
    navigate('/');
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {tt(t, 'job.finish.title', 'Auftrag abschließen')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="work-report">{tt(t, 'job.finish.reportLabel', 'Arbeitsbericht')}</Label>
              <Textarea
                id="work-report"
                placeholder={tt(t, 'job.finish.reportPlaceholder', 'Beschreiben Sie die durchgeführten Arbeiten, Befunde, verwendete Materialien, etc...')}
                value={workReport}
                onChange={(e) => setWorkReport(e.target.value)}
                onBlur={async () => {
                  // Save draft immediately when user leaves the field
                  if (workReport !== (job.workReport || '')) {
                    try {
                      await saveReportDraft(job.id, {
                        text: workReport,
                        updatedAt: new Date().toISOString()
                      });
                    } catch (error) {
                      console.warn('Failed to save draft on blur:', error);
                    }
                  }
                }}
                className="min-h-[120px] mt-2"
              />
            </div>
            
            {/* PDF Save button directly under textarea */}
            <Button 
              data-testid="btn-save-pdf"
              onClick={handleSavePdf}
              disabled={isSaving}
              variant="default"
              className="mt-3 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? tt(t, 'saving', 'PDF wird erstellt...') : tt(t, 'job.finish.btnSaveReport', 'Arbeitsbericht speichern')}
            </Button>
            
            {/* Action row with Preview and Email buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button 
                data-testid="btn-preview"
                onClick={handlePreviewReport}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {tt(t, 'job.finish.btnPreview', 'Report Vorschau')}
              </Button>
              
              <Button 
                data-testid="btn-send-email"
                onClick={handleSendReport}
                disabled={isSending}
                variant="default"
                className="flex items-center gap-2"
                title={canShareFiles() ? "Öffnet E-Mail-App mit angehängtem PDF" : "Öffnet Fallback-Optionen"}
              >
                <Mail className="h-4 w-4" />
                {isSending ? 'Sende...' : tt(t, 'job.finish.btnEmail', 'Per E-Mail versenden')}
              </Button>
              
              {!isPdfReady && (
                <p className="text-xs text-muted-foreground">
                  Report wird vorbereitet...
                </p>
              )}
              
              {isPdfReady && canShareFiles() && (
                <p className="text-xs text-muted-foreground">
                  ✓ {t('shareSupported')}
                </p>
              )}
            </div>
            
            {/* Dashboard button at bottom */}
            <div className="mt-6 flex justify-end">
              <Button 
                data-testid="btn-dashboard"
                onClick={handleGoDashboard}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                {tt(t, 'job.finish.btnDashboard', 'Dashboard')}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Time Entries Table */}
        <TimeEntriesTable 
          entries={timeEntries}
          totalMinutes={totalMinutes}
          totalBreakMinutes={totalBreakMinutes}
        />
        
        {/* Overtime Breakdown */}
        <OvertimeBreakdown calculation={overtimeCalculation} />
      </div>

      {/* A4 Preview Dialog */}
      <A4Preview 
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        job={job}
        workReport={workReport}
        timeEntries={timeEntries}
        totalMinutes={totalMinutes}
        overtimeCalculation={overtimeCalculation}
      />

      {/* Confirmation Dialog for unsaved changes */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('unsavedChanges')}</DialogTitle>
          </DialogHeader>
          <p>{t('unsavedChangesText')}</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('back')}
            </Button>
            <Button onClick={confirmGoToDashboard}>
              {t('continueToDashboard')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Draft Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entwurf wiederherstellen</DialogTitle>
          </DialogHeader>
          <p>Es wurde ein neuerer Entwurf des Arbeitsberichts gefunden. Möchten Sie ihn wiederherstellen?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleDiscardDraft}>
              Verwerfen
            </Button>
            <Button onClick={handleRestoreDraft}>
              Wiederherstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Fallback Modal */}
      <ShareFallbackModal
        open={showFallbackModal}
        onOpenChange={setShowFallbackModal}
        file={fallbackFile}
        job={job}
        workReport={workReport}
        profile={profile}
      />
    </>
  );
};