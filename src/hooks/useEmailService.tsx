import { useUserProfile } from '@/contexts/UserProfileContext';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useToast } from '@/hooks/use-toast';
import { sendReportEmail } from '@/lib/sendReportEmail';
import { useExportSettings } from '@/hooks/useExportSettings';
import { extractTimeEntriesFromJob, calculateTotalHoursFromEntries } from '@/lib/timeCalc';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';

export const useEmailService = () => {
  const { profile } = useUserProfile();
  const { sendJobReportByEmail } = useExcelExport();
  const { toast } = useToast();
  const exportSettings = useExportSettings();
  const { calculateOvertime } = useOvertimeCalculation();

  const sendJobReport = async (jobData: any) => {
    // Get email recipients from profile with fallback
    const emailData = {
      to: profile.reportTo || profile.email,
      cc: profile.reportCc,
      bcc: profile.reportBcc
    };
    
    // Check if we have at least a TO recipient
    const toEmails = emailData.to ? emailData.to.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
    if (toEmails.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Kein gültiger Empfänger gefunden. Bitte unter Einstellungen → Profil → Standard-Empfänger hinterlegen.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Check if we should send PDF report or Excel
      if (jobData.workReport) {
        // Send PDF report for finished jobs
        const timeEntries = extractTimeEntriesFromJob(jobData);
        const { totalMinutes } = calculateTotalHoursFromEntries(timeEntries);
        const overtimeCalculation = calculateOvertime(jobData);
        
        const reportData = {
          job: jobData,
          workReport: jobData.workReport,
          timeEntries,
          totalMinutes,
          overtimeCalculation
        };

        const result = await sendReportEmail({
          data: reportData,
          profile,
          exportDirUri: exportSettings.exportDirUri
        });

        if (result.success) {
          toast({
            title: 'Bericht gesendet',
            description: result.method === 'native-android' ? 
              'E-Mail-App wurde mit PDF-Anhang geöffnet.' :
              'E-Mail-Client wurde geöffnet.',
          });
          return true;
        }
        return false;
      } else {
        // Use Excel export service for jobs without work report
        return await sendJobReportByEmail(jobData);
      }
    } catch (error) {
      console.error('Error sending report:', error);
      
      if (String(error).includes('NO_DIR')) {
        toast({
          title: 'Fehler',
          description: 'Bitte zuerst einen Speicherordner unter Einstellungen → Export auswählen.',
          variant: 'destructive',
        });
      } else if (String(error).includes('EMAIL_COMPOSE_FAILED')) {
        toast({
          title: 'Fehler',
          description: 'E-Mail-App konnte nicht geöffnet werden. Bitte Standard-E-Mail-App prüfen.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fehler',
          description: 'Report konnte nicht gesendet werden',
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  return { sendJobReport };
};