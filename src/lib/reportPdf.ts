import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Job } from '@/hooks/useJobs';
import { TimeEntry } from '@/lib/timeCalc';
import { OvertimeCalculation } from '@/types/overtime';
import { getOrderRefs, formatOrderRefsForFilename } from '@/lib/orderRefs';

let lastJobId: string | null = null;
let lastBlob: Blob | null = null;
let lastJobData: string | null = null; // Hash of job data for change detection

interface ReportData {
  job: Job;
  workReport: string;
  timeEntries: TimeEntry[];
  totalMinutes: number;
  overtimeCalculation: OvertimeCalculation;
}

// Generate a simple hash of the job data to detect changes
function hashJobData(data: ReportData): string {
  return JSON.stringify({
    jobId: data.job.id,
    workReport: data.workReport,
    timeEntriesCount: data.timeEntries.length,
    totalMinutes: data.totalMinutes,
    timestamp: Date.now()
  });
}

export async function buildReportPdf(data: ReportData): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a temporary container for the report
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm';
      container.style.padding = '15mm';
      container.style.backgroundColor = 'white';
      container.style.color = 'black';
      container.style.fontFamily = 'Arial, sans-serif';
      
      const orderRefs = getOrderRefs({ id: data.job.id, evaticNo: data.job.evaticNo });
      
      // Create the HTML content
      container.innerHTML = `
        <div style="font-size: 12px; line-height: 1.4;">
          <!-- Header -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
              <div>
                <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #1f2937;">ServiceTracker</h1>
                <p style="color: #6b7280; margin: 4px 0 0 0;">Arbeitsbericht</p>
              </div>
              <div style="text-align: right; font-size: 11px; color: #6b7280;">
                <p style="margin: 0;">Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
                ${orderRefs.map(ref => `<p style="margin: 4px 0 0 0;"><strong>${ref.label}:</strong> ${ref.value}</p>`).join('')}
              </div>
            </div>
            
            <div style="border-top: 1px solid #d1d5db; padding-top: 16px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 11px;">
                <div>
                  <p style="margin: 2px 0;"><strong>Kunde:</strong> ${data.job.customerName || 'Nicht angegeben'}</p>
                  <p style="margin: 2px 0;"><strong>Adresse:</strong> ${data.job.customerAddress || 'Nicht angegeben'}</p>
                  ${(data.job.contactName || data.job.contactPhone) ? 
                    `<p style="margin: 2px 0;"><strong>Kontakt:</strong> ${[data.job.contactName, data.job.contactPhone].filter(Boolean).join(' - ')}</p>` : ''
                  }
                </div>
                <div>
                  <p style="margin: 2px 0;"><strong>Hersteller:</strong> ${data.job.manufacturer || 'Nicht angegeben'}</p>
                  <p style="margin: 2px 0;"><strong>Modell:</strong> ${data.job.model || 'Nicht angegeben'}</p>
                  <p style="margin: 2px 0;"><strong>Seriennummer:</strong> ${data.job.serialNumber || 'Nicht angegeben'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Time Entries Table -->
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; color: #1f2937;">Arbeitszeiten</h2>
            ${data.timeEntries.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: left;">Datum</th>
                    <th style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: left;">Typ</th>
                    <th style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: left;">Von</th>
                    <th style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: left;">Bis</th>
                    <th style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: left;">Pause</th>
                    <th style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: left;">Dauer</th>
                    <th style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: left;">Notiz</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.timeEntries.map(entry => {
                    const rawMinutes = entry.end && entry.start ? 
                      (new Date(`2000-01-01T${entry.end}:00`).getTime() - new Date(`2000-01-01T${entry.start}:00`).getTime()) / (1000 * 60) : 0;
                    const workMinutes = Math.max(0, rawMinutes - (entry.breakMinutes || 0));
                    const formatHours = (mins: number) => {
                      const hours = Math.floor(mins / 60);
                      const minutes = mins % 60;
                      return `${hours}:${minutes.toString().padStart(2, '0')}`;
                    };
                    const getTypeLabel = (type: string) => {
                      switch (type) {
                        case 'travel': return 'Anreise';
                        case 'work': return 'Arbeitszeit'; 
                        case 'departure': return 'Abreise';
                        default: return type;
                      }
                    };
                    const formatDate = (dateStr: string) => {
                      try {
                        return new Date(dateStr).toLocaleDateString('de-DE');
                      } catch {
                        return dateStr;
                      }
                    };
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 4px 8px;">${formatDate(entry.date)}</td>
                        <td style="border: 1px solid #d1d5db; padding: 4px 8px;">${getTypeLabel(entry.type)}</td>
                        <td style="border: 1px solid #d1d5db; padding: 4px 8px;">${entry.start || ''}</td>
                        <td style="border: 1px solid #d1d5db; padding: 4px 8px;">${entry.end || ''}</td>
                        <td style="border: 1px solid #d1d5db; padding: 4px 8px;">${entry.breakMinutes || 0} Min</td>
                        <td style="border: 1px solid #d1d5db; padding: 4px 8px; font-weight: bold;">${formatHours(workMinutes)}</td>
                        <td style="border: 1px solid #d1d5db; padding: 4px 8px;">${entry.note || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td colspan="5" style="border: 1px solid #d1d5db; padding: 4px 8px; text-align: right;">Gesamtstunden:</td>
                    <td style="border: 1px solid #d1d5db; padding: 4px 8px;">${(() => {
                      const hours = Math.floor(data.totalMinutes / 60);
                      const minutes = data.totalMinutes % 60;
                      return `${hours}:${minutes.toString().padStart(2, '0')}`;
                    })()}</td>
                    <td style="border: 1px solid #d1d5db; padding: 4px 8px;"></td>
                  </tr>
                </tfoot>
              </table>
            ` : '<p style="color: #6b7280;">Keine Zeiteinträge vorhanden.</p>'}
          </div>

          <!-- Work Report -->
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; color: #1f2937;">Arbeitsbericht</h2>
            <div style="border: 1px solid #d1d5db; padding: 12px; background-color: #f9fafb; min-height: 60px; white-space: pre-wrap; font-size: 11px;">
              ${data.workReport || 'Kein Arbeitsbericht verfasst.'}
            </div>
          </div>

          <!-- Signature Section -->
          <div style="margin-top: 32px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 16px 0; color: #1f2937;">Unterschriften</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
              <div>
                <div style="border-top: 1px solid #9ca3af; padding-top: 8px;">
                  <p style="font-size: 11px; color: #6b7280; margin: 0;">Techniker</p>
                </div>
                <div style="margin-top: 16px;">
                  <p style="font-size: 11px; color: #6b7280; margin: 0;">Datum: _________________</p>
                </div>
              </div>
              <div>
                <div style="border-top: 1px solid #9ca3af; padding-top: 8px;">
                  <p style="font-size: 11px; color: #6b7280; margin: 0;">Kunde</p>
                </div>
                <div style="margin-top: 16px;">
                  <p style="font-size: 11px; color: #6b7280; margin: 0;">Datum: _________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      try {
        // Convert HTML to canvas
        const canvas = await html2canvas(container, {
          width: 794, // A4 width in pixels at 96 DPI (210mm)
          height: 1123, // A4 height in pixels at 96 DPI (297mm)
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

        // Convert to blob
        const pdfBlob = pdf.output('blob');
        
        document.body.removeChild(container);
        resolve(pdfBlob);

      } catch (error) {
        document.body.removeChild(container);
        reject(error);
      }
    } catch (error) {
      reject(error);
    }
  });
}

export async function getOrBuildReportPdf(data: ReportData): Promise<Blob> {
  const currentHash = hashJobData(data);
  
  if (lastJobId === data.job.id && lastBlob && lastJobData === currentHash) {
    return lastBlob;
  }
  
  lastBlob = await buildReportPdf(data);
  lastJobId = data.job.id;
  lastJobData = currentHash;
  
  return lastBlob;
}

export function clearReportPdfCache() {
  lastJobId = null;
  lastBlob = null;
  lastJobData = null;
}

export function generateReportFilename(job: Job): string {
  const orderRefs = getOrderRefs({ id: job.id, evaticNo: job.evaticNo });
  return `ServiceTracker_Report_${formatOrderRefsForFilename(orderRefs)}.pdf`;
}