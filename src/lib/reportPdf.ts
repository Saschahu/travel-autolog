import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Job } from '@/hooks/useJobs';
import { TimeEntry } from '@/lib/timeCalc';
import { OvertimeCalculation } from '@/types/overtime';
import { getOrderRefs } from '@/lib/orderRefs';
import { renderReportElement } from '@/components/reports/renderReport';
import { useSettingsStore } from '@/state/settingsStore';
import { createRoot } from 'react-dom/client';
import { getReportFileName } from '@/lib/reportFileName';

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
      // Get current report language
      const lang = useSettingsStore.getState().getReportLang();
      
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
      
      // Render the report with proper i18n
      const { element } = await renderReportElement(data, lang);
      
      // Create a root and render the element
      const root = createRoot(container);
      root.render(element);
      
      // Wait a bit for React to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
        
        // Clean up
        root.unmount();
        document.body.removeChild(container);
        resolve(pdfBlob);

      } catch (error) {
        // Clean up on error
        root.unmount();
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
  return getReportFileName(job);
}