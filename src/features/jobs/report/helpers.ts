import { DayReport } from '@/types/dayReport';

export function formatDayTitle(dr: DayReport, i: number, locale = 'de'): string {
  if (dr.dateISO) {
    try {
      const d = new Date(dr.dateISO);
      return d.toLocaleDateString(locale);
    } catch { 
      // ignore error
    }
  }
  return `Tag ${i + 1}`;
}

export function buildReportSummary(reports: DayReport[], locale = 'de'): string {
  return reports
    .map((dr, i) => `${formatDayTitle(dr, i, locale)}\n${(dr.text || '').trim()}`)
    .join('\n\n');
}

export function initializeReports(estimatedDays: number, existingReports?: DayReport[], oldReportText?: string): DayReport[] {
  const days = estimatedDays || 1;
  const reports: DayReport[] = [];
  
  for (let i = 0; i < days; i++) {
    const existingReport = existingReports?.find(r => r.dayIndex === i);
    reports.push({
      dayIndex: i,
      dateISO: existingReport?.dateISO,
      text: existingReport?.text || (i === 0 && oldReportText ? oldReportText : '')
    });
  }
  
  return reports;
}

export function adjustReportsToEstimatedDays(
  currentReports: DayReport[], 
  newEstimatedDays: number
): { reports: DayReport[], needsConfirmation: boolean } {
  const newDays = newEstimatedDays || 1;
  
  if (newDays > currentReports.length) {
    // Add missing reports
    const reports = [...currentReports];
    for (let i = currentReports.length; i < newDays; i++) {
      reports.push({
        dayIndex: i,
        text: ''
      });
    }
    return { reports, needsConfirmation: false };
  } else if (newDays < currentReports.length) {
    // Check if we would lose data
    const reportsToRemove = currentReports.slice(newDays);
    const hasContent = reportsToRemove.some(r => r.text.trim() !== '');
    
    return {
      reports: currentReports.slice(0, newDays),
      needsConfirmation: hasContent
    };
  }
  
  return { reports: currentReports, needsConfirmation: false };
}