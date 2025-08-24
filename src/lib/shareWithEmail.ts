import { getOrBuildReportPdf } from './reportPdf';
import { getReportFileName } from './reportFileName';
import { Job } from '@/hooks/useJobs';
import { TimeEntry } from '@/lib/timeCalc';
import { OvertimeCalculation } from '@/types/overtime';

interface UserProfile {
  reportTo?: string;
  reportCc?: string;
  reportBcc?: string;
  email?: string;
}

interface ReportData {
  job: Job;
  workReport: string;
  timeEntries: TimeEntry[];
  totalMinutes: number;
  overtimeCalculation: OvertimeCalculation;
}

export function canShareFiles(): boolean {
  // @ts-ignore - Web Share API Level 2 types may not be available
  return !!(navigator as any).canShare && !!(navigator as any).share;
}

export async function shareReportWithAttachment(data: ReportData, profile?: UserProfile) {
  try {
    const blob = await getOrBuildReportPdf(data);
    const fileName = getReportFileName(data.job);

    const file = new File([blob], fileName, { type: 'application/pdf' });

    const title = `ServiceTracker – Arbeitsbericht`;
    const text = `Arbeitsbericht ${data.job.evaticNo ? `(EVATIC ${data.job.evaticNo}) ` : ''}Job ${data.job.id}`;

    // @ts-ignore
    if ((navigator as any).canShare?.({ files: [file] })) {
      // @ts-ignore
      await (navigator as any).share({ 
        files: [file], 
        title, 
        text 
      });
      return { ok: true, method: 'share' as const };
    }

    return { ok: false, method: 'fallback' as const, file };
  } catch (error) {
    console.error('Share error:', error);
    return { ok: false, method: 'fallback' as const, error };
  }
}

export function buildEmailContent(job: Job, workReport: string): { subject: string; body: string } {
  const subject = `ServiceTracker – Arbeitsbericht ${job.evaticNo ? `(EVATIC ${job.evaticNo}) ` : ''}Job ${job.id}`;
  
  const body = `Sehr geehrte Damen und Herren,

anbei erhalten Sie den Arbeitsbericht für den Service-Auftrag.

Auftragsdaten:
- Job-ID: ${job.id}
${job.evaticNo ? `- EVATIC Nr.: ${job.evaticNo}` : ''}
- Kunde: ${job.customerName || 'Nicht angegeben'}
- Hersteller: ${job.manufacturer || 'Nicht angegeben'}
- Modell: ${job.model || 'Nicht angegeben'}
- Seriennummer: ${job.serialNumber || 'Nicht angegeben'}

${workReport ? `Arbeitsbericht:
${workReport}

` : ''}Bei Fragen stehe ich Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
ServiceTracker Team`;

  return { subject, body };
}

export function buildMailtoUrl(
  recipients: { to?: string; cc?: string; bcc?: string },
  subject: string,
  body: string
): string {
  // Use proper encodeURIComponent for all parameters to avoid + issues
  const parts = [];
  
  if (recipients.cc) parts.push(`cc=${encodeURIComponent(recipients.cc)}`);
  if (recipients.bcc) parts.push(`bcc=${encodeURIComponent(recipients.bcc)}`);
  parts.push(`subject=${encodeURIComponent(subject)}`);
  parts.push(`body=${encodeURIComponent(body)}`);

  const to = recipients.to ? encodeURIComponent(recipients.to) : '';
  return `mailto:${to}?${parts.join('&')}`;
}

export function openMailtoLink(url: string): boolean {
  try {
    window.location.href = url;
    return true;
  } catch (error) {
    console.error('Failed to open mailto link:', error);
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}