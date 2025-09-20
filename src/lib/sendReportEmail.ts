import { Capacitor } from '@capacitor/core';
import type { Job } from '@/hooks/useJobs';
import { toBase64 } from '@/lib/files';
import { getReportFileName } from '@/lib/reportFileName';
import { getOrBuildReportPdf } from '@/lib/reportPdf';
import { buildEmailContent, buildMailtoUrl } from '@/lib/shareWithEmail';
import type { TimeEntry } from '@/lib/timeCalc';
import { DirectoryPicker } from '@/plugins/directoryPicker';
import { EmailSender } from '@/plugins/emailSender';
import type { OvertimeCalculation } from '@/types/overtime';

interface UserProfile {
  reportTo?: string;
  reportCc?: string;
  reportBcc?: string;
  email?: string;
  preferredEmailApp?: string;
}

interface ReportData {
  job: Job;
  workReport: string;
  timeEntries: TimeEntry[];
  totalMinutes: number;
  overtimeCalculation: OvertimeCalculation;
}

interface SendEmailContext {
  data: ReportData;
  profile?: UserProfile;
  exportDirUri?: string;
}

export async function sendReportEmail(ctx: SendEmailContext): Promise<{ success: boolean; method: string }> {
  const { data, profile, exportDirUri } = ctx;
  const { job, workReport } = data;
  
  // Build email content
  const { subject, body } = buildEmailContent(job, workReport);
  
  // Get recipients
  const recipients = {
    to: profile?.reportTo || profile?.email,
    cc: profile?.reportCc,
    bcc: profile?.reportBcc
  };

  // Generate PDF
  const blob = await getOrBuildReportPdf(data);
  const fileName = getReportFileName(job);

  // Android native email with attachment
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    if (!exportDirUri) {
      throw new Error('NO_DIR');
    }
    
    try {
      // Save PDF to SAF directory
      const base64 = await toBase64(blob);
      const { uri } = await DirectoryPicker.writeFile({
        dirUri: exportDirUri,
        fileName,
        mimeType: 'application/pdf',
        base64Data: base64
      });
      
      // Open email composer with attachment
      await EmailSender.compose({
        to: recipients.to ? [recipients.to] : undefined,
        subject,
        body,
        attachmentUri: uri,
        mime: 'application/pdf',
        packageName: profile?.preferredEmailApp || undefined
      });
      
      return { success: true, method: 'native-android' };
    } catch (error) {
      if (String(error).includes('EMAIL_COMPOSE_FAILED')) {
        throw new Error('EMAIL_COMPOSE_FAILED');
      }
      throw error;
    }
  }

  // Web fallback - mailto without attachment
  const mailtoUrl = buildMailtoUrl(recipients, subject, body);
  window.location.href = mailtoUrl;
  
  return { success: true, method: 'web-mailto' };
}