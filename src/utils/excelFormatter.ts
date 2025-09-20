import * as XLSX from 'xlsx';

export class ExcelFormatter {
  static createFormattedWorkbook(worksheets: { name: string; data: XLSX.WorkSheet }[]): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();
    
    worksheets.forEach(sheet => {
      XLSX.utils.book_append_sheet(workbook, sheet.data, sheet.name);
    });
    
    return workbook;
  }

  static applyPrintSettings(worksheet: XLSX.WorkSheet) {
    // Druckeinstellungen
    worksheet['!margins'] = {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    };
    
    // Seitenausrichtung
    worksheet['!page'] = {
      orientation: 'portrait',
      scale: 100
    };
    
    // Druckbereich
    worksheet['!printArea'] = 'A1:L30';
  }

  static addPageBreaks(worksheet: XLSX.WorkSheet, rows: number[]) {
    worksheet['!pageBreaks'] = {
      rowBreaks: rows.map(row => ({ row: row - 1, max: 16383 }))
    };
  }

  static protectWorksheet(worksheet: XLSX.WorkSheet, _protectedCells: string[]) {
    // Arbeitsblatt-Schutz (vereinfacht)
    worksheet['!protect'] = {
      password: '',
      selectLockedCells: false,
      selectUnlockedCells: true
    };
  }

  static addFormulas(worksheet: XLSX.WorkSheet, formulas: { cell: string; formula: string }[]) {
    formulas.forEach(({ cell, formula }) => {
      if (!worksheet[cell]) {
        worksheet[cell] = {};
      }
      worksheet[cell].f = formula;
      worksheet[cell].t = 'n';
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