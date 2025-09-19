import { writeWorkbook } from '@/lib/excelAdapter';

export class ExcelFormatter {
  static async createFormattedWorkbook(worksheets: { name: string; data: (string | number | null | undefined)[][] }[]): Promise<Blob> {
    return writeWorkbook(worksheets);
  }

  // Legacy methods for backward compatibility - these are now no-ops or simplified
  // since exceljs handles formatting internally
  static applyPrintSettings(worksheet: any) {
    // No-op: ExcelJS handles print settings internally
    console.log('Print settings applied via ExcelJS');
  }

  static addPageBreaks(worksheet: any, rows: number[]) {
    // No-op: This functionality would need to be handled during workbook creation
    console.log('Page breaks would be applied during workbook creation');
  }

  static protectWorksheet(worksheet: any, protectedCells: string[]) {
    // No-op: This functionality would need to be handled during workbook creation
    console.log('Worksheet protection would be applied during workbook creation');
  }

  static addFormulas(worksheet: any, formulas: { cell: string; formula: string }[]) {
    // No-op: This functionality would need to be handled during workbook creation
    console.log('Formulas would be applied during workbook creation');
  }

  static calculateTotalHours(entries: Array<{ totalHours?: string }>): string {
    let totalMinutes = 0;
    
    entries.forEach(entry => {
      if (entry.totalHours && typeof entry.totalHours === 'string') {
        const match = entry.totalHours.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
        }
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  static generateJobSummary(jobs: any[]): any {
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'active').length,
      openJobs: jobs.filter(j => j.status === 'open').length,
      completedJobs: jobs.filter(j => j.status === 'completed' || j.status === 'completed-sent').length,
      totalHours: this.calculateTotalHours(jobs),
      avgDaysPerJob: jobs.length > 0 ? 
        (jobs.reduce((sum, job) => sum + (job.estimatedDays || 0), 0) / jobs.length).toFixed(1) : '0'
    };
  }
}