import { FileCheck, Mail, Eye, LayoutDashboard, Save } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { A4Preview } from './A4Preview';
import { OvertimeBreakdown } from './OvertimeBreakdown';
import { ShareFallbackModal } from './ShareFallbackModal';
import { TimeEntriesTable } from './TimeEntriesTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { buildReportSummary } from '@/features/jobs/report/helpers';
import { useToast } from '@/hooks/use-toast';
import { useDayTypeDetection } from '@/hooks/useDayTypeDetection';
import { useEmailService } from '@/hooks/useEmailService';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useExportSettings } from '@/hooks/useExportSettings';
import type { Job } from '@/hooks/useJobs';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { isFileSystemAccessSupported, writeFile, getDirectoryName } from '@/lib/fsAccess';
import { loadExportHandle } from '@/lib/fsStore';
import type { DayOverrides } from '@/lib/holidays';
import { tt } from '@/lib/i18nSafe';
import { getReportFileName } from '@/lib/reportFileName';
import { getOrBuildReportPdf, clearReportPdfCache } from '@/lib/reportPdf';
import { sendReportEmail } from '@/lib/sendReportEmail';
import { shareReportWithAttachment, canShareFiles } from '@/lib/shareWithEmail';
import { extractTimeEntriesFromJob, calculateTotalHoursFromEntries } from '@/lib/timeCalc';

interface FinishJobTabProps {
  job: Job;
  onJobUpdate: (updatedJob: Job) => void;
  onCloseDialog?: () => void;
}

export const FinishJobTab = ({ job, onCloseDialog }: FinishJobTabProps) => {
  // Build workReport from reports array for backwards compatibility and PDF generation
  const workReport = useMemo(() => {
    if (job.reports && job.reports.length > 0) {
      return buildReportSummary(job.reports);
    }
    return job.workReport || '';
  }, [job.reports, job.workReport]);

  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackFile, setFallbackFile] = useState<File | undefined>();
  const [isPdfReady, setIsPdfReady] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { t } = useTranslation();
  const exportSettings = useExportSettings();

  const { calculateOvertime, recalcTrigger } = useOvertimeCalculation();

  // Calculate time entries and totals
  const timeEntries = useMemo(() => extractTimeEntriesFromJob(job), [job]);
  const { totalMinutes, totalBreakMinutes } = useMemo(() => 
    calculateTotalHoursFromEntries(timeEntries), [timeEntries]
  );
  
  // Calculate overtime
  const overtimeCalculation = useMemo(() => calculateOvertime(job), [job, calculateOvertime, recalcTrigger]);

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

  const handleSendReport = async () => {
    setIsSending(true);
    try {
      const reportData = {
        job,
        workReport,
        timeEntries,
        totalMinutes,
        overtimeCalculation
      };

      // Try new unified email sender
      const result = await sendReportEmail({
        data: reportData,
        profile,
        exportDirUri: exportSettings.exportDirUri
      });

      if (result.success) {
         toast({
           title: t('reportSent'),
           description: result.method === 'native-android' ? 
             t('directShareSupported') :
             t('reportSent'),
         });
      }
    } catch (error) {
      console.error('Error in handleSendReport:', error);
      
      if (String(error).includes('NO_DIR')) {
         toast({
           title: t('error'),
           description: t('selectFolderFirst'),
           variant: 'destructive',
         });
      } else if (String(error).includes('EMAIL_COMPOSE_FAILED')) {
         toast({
           title: t('error'),
           description: t('emailAppError'),
           variant: 'destructive',
         });
      } else {
        // Fallback to Web Share API
        try {
          const reportData = {
            job,
            workReport,
            timeEntries,
            totalMinutes,
            overtimeCalculation
          };

          const result = await shareReportWithAttachment(reportData);
          
          if (result.ok) {
             toast({
               title: t('reportSent'),
               description: t('reportSentSuccess'),
             });
          } else {
            // Show fallback modal
            setFallbackFile(result.file);
            setShowFallbackModal(true);
          }
        } catch (_fallbackError) {
           toast({
             title: t('error'),
             description: t('errorSendingReport'),
             variant: 'destructive',
           });
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSavePdf = async () => {
    setIsSaving(true);
    try {
       toast({
         title: t('saving'),
         description: t('creatingPdf'),
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
         description: t('downloadingFile'),
       });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
       toast({
         title: t('pdfSaved'),
         description: t('pdfDownloadSuccess'),
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
    // Clear cache to ensure latest data is used
    clearReportPdfCache();
    setIsPreviewOpen(true);
  };

  const handleGoDashboard = () => {
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
              <Label htmlFor="work-report-summary">{tt(t, 'job.finish.reportSummaryLabel', 'Arbeitsbericht Zusammenfassung')}</Label>
              <div 
                data-testid="report-summary"
                className="mt-2 min-h-[120px] p-3 border rounded-md bg-muted/10 text-sm whitespace-pre-wrap font-mono"
              >
                {workReport || 'Keine Reports erstellt'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Reports können im "Report" Tab bearbeitet werden.
              </p>
            </div>
            
            {/* PDF Save button */}
            <Button 
              data-testid="btn-save-pdf"
              onClick={handleSavePdf}
              disabled={isSaving}
              variant="default"
              className="mt-3 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? t('saving') : tt(t, 'job.finish.btnSaveReport', 'Arbeitsbericht speichern')}
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
                title={canShareFiles() ? t('directShareSupported') : t('errorSendingReport')}
              >
                <Mail className="h-4 w-4" />
                {isSending ? t('sending') : tt(t, 'job.finish.btnEmail', 'Per E-Mail versenden')}
              </Button>
              
               {!isPdfReady && (
                 <p className="text-xs text-muted-foreground">
                   {t('reportPreparingBackground')}
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

      {/* Confirmation Dialog - removed since no unsaved changes */}

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