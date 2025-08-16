import * as XLSX from 'xlsx';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { ExcelTemplate, JobTemplateData } from '@/templates/ExcelTemplate';
import { ExcelFormatter } from '@/utils/excelFormatter';
import { generateSingleJobTemplateBuffer } from '@/templates/ExcelTemplateExcelJS';

export const useExcelExport = () => {
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const generateJobExcel = (jobs: any[], reportType: 'single' | 'all' = 'all') => {
    const workbook = XLSX.utils.book_new();
    
    if (reportType === 'single' && jobs.length === 1) {
      // Einzelner Auftrag - verwende das professionelle Template
      const job = jobs[0];
      const template = new ExcelTemplate();
      
      const templateData: JobTemplateData = {
        customerName: job.customerName || '',
        jobId: job.id || '',
        startDate: new Date(job.startDate || new Date()),
        endDate: job.endDate ? new Date(job.endDate) : undefined,
        dailyEntries: generateDailyEntries(job),
        totalHours: job.totalHours || '0h 0m',
        status: job.status || 'open',
        estimatedDays: job.estimatedDays || 0,
        currentDay: job.currentDay || 0
      };
      
      const worksheet = template.fillJobData(templateData);
      ExcelFormatter.applyPrintSettings(worksheet);
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Arbeitszeit-Nachweis');
    } else {
      // Mehrere Aufträge - verwende die ursprüngliche Tabellen-Ansicht
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

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      const columnWidths = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Aufträge');

      // Zusammenfassung für mehrere Aufträge
      if (jobs.length > 1) {
        const summary = ExcelFormatter.generateJobSummary(jobs);
        const summaryData = [
          ['Gesamtanzahl Aufträge', summary.totalJobs],
          ['Aktive Aufträge', summary.activeJobs],
          ['Offene Aufträge', summary.openJobs],
          ['Abgeschlossene Aufträge', summary.completedJobs],
          ['', ''],
          ['Gesamtstunden (alle Aufträge)', summary.totalHours],
          ['Durchschnittliche Tage pro Auftrag', summary.avgDaysPerJob]
        ];

        const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Zusammenfassung');
      }
    }

    return workbook;
  };

  const exportToExcel = async (jobs: any[], filename?: string) => {
    // Plattform unterscheiden
    const platform = Capacitor.getPlatform();

    // Wenn genau ein Auftrag exportiert wird, nutze die formatierte ExcelJS-Vorlage
    if (jobs.length === 1) {
      const job = jobs[0];
      const templateData: JobTemplateData = {
        customerName: job.customerName || '',
        jobId: job.id || '',
        startDate: new Date(job.startDate || new Date()),
        endDate: job.endDate ? new Date(job.endDate) : undefined,
        dailyEntries: generateDailyEntries(job),
        totalHours: job.totalHours || '0h 0m',
        status: getStatusText(job.status || 'open'),
        estimatedDays: job.estimatedDays || 0,
        currentDay: job.currentDay || 0,
      };

      try {
        const buffer = await generateSingleJobTemplateBuffer(templateData);
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const defaultFilename = filename || `Arbeitszeit-Nachweis_${(job.customerName||'Kunde').replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

        const triggerDownload = () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = defaultFilename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        };

        if (platform !== 'web') {
          await Share.share({ title: 'Excel Export - Auftrag', text: `Excel-Report: ${defaultFilename}`, url, dialogTitle: 'Excel-Datei teilen' });
        } else {
          triggerDownload();
        }

        toast({ title: 'Excel Export erfolgreich', description: platform !== 'web' ? 'Die Excel-Datei wurde erstellt und kann geteilt werden' : 'Download gestartet' });
        return true;
      } catch (error) {
        console.warn('Single job export failed, falling back:', error);
        // Fallback weiter unten: mehrfachexport
      }
    }

    // Mehrere Aufträge oder Fallback → ursprüngliche Tabellen-Ansicht
    const workbook = generateJobExcel(jobs);
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const defaultFilename = filename || `Auftraege_${new Date().toISOString().split('T')[0]}.xlsx`;

    const triggerDownload = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    try {
      if (platform !== 'web') {
        await Share.share({ title: 'Excel Export - Aufträge', text: `Excel-Report: ${defaultFilename}`, url, dialogTitle: 'Excel-Datei teilen' });
      } else {
        triggerDownload();
      }
      toast({ title: 'Excel Export erfolgreich', description: platform !== 'web' ? 'Die Excel-Datei wurde erstellt und kann geteilt werden' : 'Download gestartet' });
      return true;
    } catch (error) {
      console.warn('Share failed, falling back to download:', error);
      try {
        triggerDownload();
        toast({ title: 'Excel Export erfolgreich', description: 'Download gestartet' });
        return true;
      } catch (fallbackError) {
        console.error('Excel export error:', fallbackError);
        toast({ title: 'Export Fehler', description: 'Die Excel-Datei konnte nicht erstellt werden', variant: 'destructive' });
        return false;
      }
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
      // Verwende das professionelle Template für Einzelaufträge
      const workbook = generateJobExcel([job], 'single');
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      
      const filename = `Arbeitszeit-Nachweis_${job.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const emailBody = `
Arbeitszeit-Nachweis - ${job.customerName}

Auftragsdetails:
- Kunde: ${job.customerName}
- Status: ${getStatusText(job.status)}
- Startdatum: ${formatDate(job.startDate)}
- Gesamtstunden: ${job.totalHours || 'Nicht erfasst'}
- Fortschritt: ${job.currentDay}/${job.estimatedDays} Tage

Im Anhang finden Sie den detaillierten Arbeitszeit-Nachweis.

Mit freundlichen Grüßen
${profile.name || 'ServiceTracker'}
      `.trim();

      await Share.share({
        title: `Arbeitszeit-Nachweis - ${job.customerName}`,
        text: emailBody,
        url: `mailto:${profile.email}?subject=${encodeURIComponent(`Arbeitszeit-Nachweis - ${job.customerName}`)}&body=${encodeURIComponent(emailBody)}`,
        dialogTitle: 'Report per E-Mail senden'
      });

      toast({
        title: 'Report gesendet',
        description: 'Der Arbeitszeit-Nachweis wurde zur E-Mail-App weitergeleitet',
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

  const generateDailyEntries = (job: any) => {
    const entries = [];
    const startDate = new Date(job.startDate || new Date());
    
    // Generiere tägliche Einträge basierend auf currentDay
    for (let i = 0; i < (job.currentDay || 1); i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(startDate.getDate() + i);
      
      // Verwende tatsächliche Daten falls vorhanden, sonst Platzhalter
      const dayData = job.dailyData && job.dailyData[i] ? job.dailyData[i] : {};
      
      entries.push({
        date: entryDate,
        travelStart: dayData.travelStartTime || (i === 0 ? '07:00' : ''),
        travelEnd: dayData.travelEndTime || (i === 0 ? '08:00' : ''),
        workStart: dayData.workStartTime || job.workStartTime || '08:00',
        workEnd: dayData.workEndTime || job.workEndTime || '17:00',
        departureStart: dayData.departureStartTime || (i === (job.currentDay || 1) - 1 ? '17:00' : ''),
        departureEnd: dayData.departureEndTime || (i === (job.currentDay || 1) - 1 ? '18:00' : ''),
        breakTime: dayData.breakTime || '30min',
        totalHours: dayData.totalHours || (i === 0 ? job.totalHours : ''),
        description: dayData.description || `Arbeiten für ${job.customerName}`
      });
    }
    
    return entries;
  };

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

  return {
    exportToExcel,
    sendJobReportByEmail,
    generateJobExcel
  };
};