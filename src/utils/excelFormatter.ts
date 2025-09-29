// @ts-nocheck
import ExcelJS from 'exceljs';

export class ExcelFormatter {
  static createFormattedWorkbook(worksheets: { name: string; data: any[][] }[]): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    
    worksheets.forEach(sheet => {
      const worksheet = workbook.addWorksheet(sheet.name);
      sheet.data.forEach(row => {
        worksheet.addRow(row);
      });
    });
    
    return workbook;
  }

  static applyPrintSettings(worksheet: ExcelJS.Worksheet) {
    // Druckeinstellungen
    worksheet.pageSetup = {
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      },
      orientation: 'portrait',
      scale: 100,
      printArea: 'A1:L30'
    };
  }

  static addPageBreaks(worksheet: ExcelJS.Worksheet, rows: number[]) {
    rows.forEach(row => {
      worksheet.getRow(row).addPageBreak = true;
    });
  }

  static protectWorksheet(worksheet: ExcelJS.Worksheet, protectedCells: string[]) {
    // Arbeitsblatt-Schutz (vereinfacht)
    worksheet.protect('', {
      selectLockedCells: false,
      selectUnlockedCells: true
    });
  }

  static addFormulas(worksheet: ExcelJS.Worksheet, formulas: { cell: string; formula: string }[]) {
    formulas.forEach(({ cell, formula }) => {
      const excelCell = worksheet.getCell(cell);
      excelCell.value = { formula };
    });
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