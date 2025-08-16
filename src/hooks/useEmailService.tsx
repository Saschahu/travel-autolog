import { useUserProfile } from '@/contexts/UserProfileContext';
import { Share } from '@capacitor/share';
import { useToast } from '@/hooks/use-toast';

export const useEmailService = () => {
  const { profile } = useUserProfile();
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
      const reportText = generateReportText(jobData);
      
      await Share.share({
        title: `Auftragsbericht - ${jobData.customerName}`,
        text: reportText,
        url: `mailto:${profile.email}?subject=${encodeURIComponent(`Auftragsbericht - ${jobData.customerName}`)}&body=${encodeURIComponent(reportText)}`,
      });

      toast({
        title: 'Erfolgreich',
        description: 'Report wurde an E-Mail-App gesendet',
      });

      return true;
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

  const generateReportText = (jobData: any) => {
    return `
Auftragsbericht

Kunde: ${jobData.customerName}
Datum: ${jobData.startDate}
Status: ${jobData.status}

Arbeitszeiten:
- Arbeitsbeginn: ${jobData.workStartTime || 'Nicht erfasst'}
- Arbeitsende: ${jobData.workEndTime || 'Nicht erfasst'}
- Gesamtzeit: ${jobData.totalHours || 'Nicht berechnet'}

Mit freundlichen Grüßen
${profile.name}
    `.trim();
  };

  return { sendJobReport };
};