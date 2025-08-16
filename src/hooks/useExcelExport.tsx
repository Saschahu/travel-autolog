import * as XLSX from 'xlsx';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Share } from '@capacitor/share';
import { useToast } from '@/hooks/use-toast';

export const useExcelExport = () => {
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const generateJobExcel = (jobs: any[], reportType: 'single' | 'all' = 'all') => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = jobs.map(job => ({
      'Auftragsnummer': job.id,
      'Kundenname': job.customerName,
      'Status': getStatusText(job.status),
      'Startdatum': formatDate(job.startDate),
      'Geschätzte Tage': job.estimatedDays || 0,
      'Aktueller Tag': job.currentDay || 0,
      'Gesamtstunden': job.totalHours || '0h 0m',
      'Arbeitsbeginn': job.workStartTime || '',
      'Arbeitsende': job.workEndTime || '',
      'Fortschritt (%)': job.estimatedDays ? Math.round((job.currentDay / job.estimatedDays) * 100) : 0
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Auftragsnummer
      { wch: 25 }, // Kundenname
      { wch: 15 }, // Status
      { wch: 12 }, // Startdatum
      { wch: 15 }, // Geschätzte Tage
      { wch: 15 }, // Aktueller Tag
      { wch: 15 }, // Gesamtstunden
      { wch: 12 }, // Arbeitsbeginn
      { wch: 12 }, // Arbeitsende
      { wch: 15 }  // Fortschritt
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aufträge');

    // Add summary sheet if multiple jobs
    if (reportType === 'all' && jobs.length > 1) {
      const summaryData = [
        ['Gesamtanzahl Aufträge', jobs.length],
        ['Aktive Aufträge', jobs.filter(j => j.status === 'active').length],
        ['Offene Aufträge', jobs.filter(j => j.status === 'open').length],
        ['Abgeschlossene Aufträge', jobs.filter(j => j.status === 'completed' || j.status === 'completed-sent').length],
        ['', ''],
        ['Gesamtstunden (alle Aufträge)', calculateTotalHours(jobs)],
        ['Durchschnittliche Tage pro Auftrag', (jobs.reduce((sum, job) => sum + (job.estimatedDays || 0), 0) / jobs.length).toFixed(1)]
      ];

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Zusammenfassung');
    }

    return workbook;
  };

  const exportToExcel = async (jobs: any[], filename?: string) => {
    try {
      const workbook = generateJobExcel(jobs);
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      
      // Create blob
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      const defaultFilename = filename || `Auftraege_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Use Capacitor Share for mobile compatibility
      await Share.share({
        title: 'Excel Export - Aufträge',
        text: `Excel-Report: ${defaultFilename}`,
        url: url,
        dialogTitle: 'Excel-Datei teilen'
      });

      toast({
        title: 'Excel Export erfolgreich',
        description: 'Die Excel-Datei wurde erstellt und kann geteilt werden',
      });

      return true;
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: 'Export Fehler',
        description: 'Die Excel-Datei konnte nicht erstellt werden',
        variant: 'destructive',
      });
      return false;
    }
  };

  const sendJobReportByEmail = async (job: any) => {
    if (!profile.email) {
      toast({
        title: 'Fehler',
        description: 'Keine E-Mail-Adresse in den Einstellungen hinterlegt',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Generate Excel for single job
      const workbook = generateJobExcel([job], 'single');
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      
      const filename = `Auftragsbericht_${job.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Create email content
      const emailBody = `
Auftragsbericht - ${job.customerName}

Auftragsdetails:
- Kunde: ${job.customerName}
- Status: ${getStatusText(job.status)}
- Startdatum: ${formatDate(job.startDate)}
- Gesamtstunden: ${job.totalHours || 'Nicht erfasst'}
- Fortschritt: ${job.currentDay}/${job.estimatedDays} Tage

Im Anhang finden Sie den detaillierten Excel-Report.

Mit freundlichen Grüßen
${profile.name || 'ServiceTracker'}
      `.trim();

      // Use Capacitor Share with email intent
      await Share.share({
        title: `Auftragsbericht - ${job.customerName}`,
        text: emailBody,
        url: `mailto:${profile.email}?subject=${encodeURIComponent(`Auftragsbericht - ${job.customerName}`)}&body=${encodeURIComponent(emailBody)}`,
        dialogTitle: 'Report per E-Mail senden'
      });

      toast({
        title: 'Report gesendet',
        description: 'Der Excel-Report wurde zur E-Mail-App weitergeleitet',
      });

      return true;
    } catch (error) {
      console.error('Email report error:', error);
      toast({
        title: 'Fehler beim Senden',
        description: 'Der Report konnte nicht gesendet werden',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Helper functions
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Offen';
      case 'active': return 'Aktiv';
      case 'completed': return 'Abgeschlossen';
      case 'completed-sent': return 'Abgeschlossen & Gesendet';
      case 'pending': return 'Ausstehend';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE');
  };

  const calculateTotalHours = (jobs: any[]) => {
    // Simple calculation - in real app this would be more sophisticated
    let totalMinutes = 0;
    jobs.forEach(job => {
      if (job.totalHours && typeof job.totalHours === 'string') {
        const match = job.totalHours.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
        }
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return {
    exportToExcel,
    sendJobReportByEmail,
    generateJobExcel
  };
};