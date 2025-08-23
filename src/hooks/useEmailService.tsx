import { useUserProfile } from '@/contexts/UserProfileContext';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useToast } from '@/hooks/use-toast';

export const useEmailService = () => {
  const { profile } = useUserProfile();
  const { sendJobReportByEmail } = useExcelExport();
  const { toast } = useToast();

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
      // Use Excel export service to send detailed report
      return await sendJobReportByEmail(jobData);
    } catch (error) {
      console.error('Error sending report:', error);
      toast({
        title: 'Fehler',
        description: 'Report konnte nicht gesendet werden',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { sendJobReport };
};