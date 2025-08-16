import { useUserProfile } from '@/contexts/UserProfileContext';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useToast } from '@/hooks/use-toast';

export const useEmailService = () => {
  const { profile } = useUserProfile();
  const { sendJobReportByEmail } = useExcelExport();
  const { toast } = useToast();

  const sendJobReport = async (jobData: any) => {
    if (!profile.email) {
      toast({
        title: 'Fehler',
        description: 'Keine E-Mail-Adresse in den Einstellungen hinterlegt',
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