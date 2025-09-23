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
import { makeReportPdf } from './pdfOptimized';

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

// Generate a detailed hash of the job data to detect changes
function hashJobData(data: ReportData): string {
  return JSON.stringify({
    jobId: data.job.id,
    workReport: data.workReport,
    timeEntriesCount: data.timeEntries.length,
    totalMinutes: data.totalMinutes,
    // Include detailed time entries data to detect date changes
    timeEntries: data.timeEntries.map(entry => ({
      id: entry.id,
      date: entry.date,
      type: entry.type,
      start: entry.start,
      end: entry.end,
      breakMinutes: entry.breakMinutes,
      note: entry.note
    })),
    // Include job days data to detect date changes
    jobDays: data.job.days?.map(day => ({
      date: day.date,
      travelStartTime: day.travelStartTime,
      travelEndTime: day.travelEndTime,
      workStartTime: day.workStartTime,
      workEndTime: day.workEndTime,
      departureStartTime: day.departureStartTime,
      departureEndTime: day.departureEndTime
    })) || [],
    overtimeHours: data.overtimeCalculation.totalOvertimeHours
  });
}

export async function buildReportPdf(data: ReportData): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    void (async () => {
      try {
        // Get current report language and PDF quality setting
        const settings = useSettingsStore.getState();
        const lang = settings.getReportLang();
        const quality = (settings.pdfQuality ?? 60) / 100; // Default 60%
        
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
          // Use optimized PDF generation with JPEG compression
          const pdfBlob = await makeReportPdf(container, { 
            quality, 
            scale: 2 
          });
          
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
    })();
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