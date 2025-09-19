export interface JobTemplateData {
  customerName: string;
  jobId: string;
  evaticNo?: string;
  startDate: Date;
  endDate?: Date;
  dailyEntries: Array<{
    date: Date;
    travelStart?: string;
    travelEnd?: string;
    workStart?: string;
    workEnd?: string;
    departureStart?: string;
    departureEnd?: string;
    breakTime?: string;
    totalHours?: string;
    description?: string;
  }>;
  totalHours: string;
  status: string;
  estimatedDays: number;
  currentDay: number;
}

export class ExcelTemplate {
  private rows: (string | number | null)[][] = [];
  private currentRow: number = 1;

  constructor() {
    this.initializeTemplate();
  }

  private initializeTemplate() {
    // Initialize a basic template structure as a 2D array
    // This creates a simplified version of the Excel template
    this.rows = [];
    
    // Header
    this.addRow(['ARBEITSZEIT-NACHWEIS', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['Auftraggeber:', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['Evatic-Nr.:', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Anreise section
    this.addRow(['ANREISE', '', '', '', '', '', '', '', 'ZUSAMMENFASSUNG', '', '', '', '']);
    this.addRow(['DATUM', 'TAG', 'START', 'ENDE', 'STUNDEN', '', '', '', 'Anreisestunden:', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', 'Arbeitsstunden:', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', 'Abreisestunden:', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', 'Gesamtstunden:', '', '', '', '']);
    
    // Arbeitszeit section
    this.addRow(['ARBEITSZEIT', '', '', '', '', '', '', '', 'Zeitraum:', '', '', '', '']);
    this.addRow(['DATUM', 'TAG', 'VON', 'BIS', 'PAUSE', 'STUNDEN', '', '', 'Status:', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Abreise section
    this.addRow(['ABREISE', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['DATUM', 'TAG', 'START', 'ENDE', 'STUNDEN', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Bemerkungen
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['Bemerkungen:', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    this.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '']);
  }

  private addRow(row: (string | number | null)[]) {
    this.rows.push(row);
  }

  public fillJobData(data: JobTemplateData): (string | number | null)[][] {
    // Make a copy of the template
    const filledRows = this.rows.map(row => [...row]);
    
    // Fill in the data
    if (filledRows[2]) filledRows[2][1] = data.customerName;
    if (filledRows[3]) filledRows[3][1] = data.evaticNo || data.jobId;
    
    // Zeitraum und Status
    const timeRange = `${this.formatDate(data.startDate)} - ${data.endDate ? this.formatDate(data.endDate) : 'laufend'}`;
    if (filledRows[10]) filledRows[10][11] = timeRange;
    if (filledRows[11]) filledRows[11][11] = this.getStatusText(data.status);
    
    // Process daily entries
    const travelEntries = data.dailyEntries.filter(e => e.travelStart || e.travelEnd);
    const workEntries = data.dailyEntries.filter(e => e.workStart || e.workEnd);
    const departureEntries = data.dailyEntries.filter(e => e.departureStart || e.departureEnd);
    
    // Fill travel entries (starting at row 6, index 6)
    let rowIndex = 6;
    travelEntries.forEach((entry, index) => {
      if (rowIndex < filledRows.length) {
        const row = filledRows[rowIndex + index];
        if (row) {
          row[0] = this.formatDate(entry.date);
          row[1] = this.getDayName(entry.date);
          row[2] = entry.travelStart || '';
          row[3] = entry.travelEnd || '';
          row[4] = this.calculateHours(entry.travelStart, entry.travelEnd);
        }
      }
    });
    
    // Fill work entries (starting at row 11, index 11)
    rowIndex = 11;
    workEntries.forEach((entry, index) => {
      if (rowIndex + index < filledRows.length) {
        const row = filledRows[rowIndex + index];
        if (row) {
          row[0] = this.formatDate(entry.date);
          row[1] = this.getDayName(entry.date);
          row[2] = entry.workStart || '';
          row[3] = entry.workEnd || '';
          row[4] = entry.breakTime || '';
          row[5] = this.calculateHours(entry.workStart, entry.workEnd, entry.breakTime);
        }
      }
    });
    
    // Fill departure entries (starting at row 17, index 17)
    rowIndex = 17;
    departureEntries.forEach((entry, index) => {
      if (rowIndex + index < filledRows.length) {
        const row = filledRows[rowIndex + index];
        if (row) {
          row[0] = this.formatDate(entry.date);
          row[1] = this.getDayName(entry.date);
          row[2] = entry.departureStart || '';
          row[3] = entry.departureEnd || '';
          row[4] = this.calculateHours(entry.departureStart, entry.departureEnd);
        }
      }
    });
    
    // Calculate totals
    const travelHours = this.sumHours(travelEntries.map(e => this.calculateHours(e.travelStart, e.travelEnd)));
    const workHours = this.sumHours(workEntries.map(e => this.calculateHours(e.workStart, e.workEnd, e.breakTime)));
    const departureHours = this.sumHours(departureEntries.map(e => this.calculateHours(e.departureStart, e.departureEnd)));
    const totalHours = this.sumHours([travelHours, workHours, departureHours]);
    
    // Fill summary
    if (filledRows[6]) filledRows[6][11] = travelHours;
    if (filledRows[7]) filledRows[7][11] = workHours;
    if (filledRows[8]) filledRows[8][11] = departureHours;
    if (filledRows[9]) filledRows[9][11] = totalHours;
    
    return filledRows;
  }

  private calculateHours(startTime?: string, endTime?: string, breakTime?: string): string {
    if (!startTime || !endTime) return '';
    
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    
    if (!start || !end) return '';
    
    let totalMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);
    
    if (breakTime) {
      const breakMinutes = this.parseBreakTime(breakTime);
      totalMinutes -= breakMinutes;
    }
    
    if (totalMinutes < 0) totalMinutes = 0;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } | null {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    
    return {
      hours: parseInt(match[1]),
      minutes: parseInt(match[2])
    };
  }

  private parseBreakTime(breakStr: string): number {
    const match = breakStr.match(/^(\d+):(\d{2})$/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    
    const minutesMatch = breakStr.match(/^(\d+)$/);
    if (minutesMatch) {
      return parseInt(minutesMatch[1]);
    }
    
    return 0;
  }

  private sumHours(hourStrings: string[]): string {
    let totalMinutes = 0;
    
    hourStrings.forEach(hourStr => {
      if (hourStr) {
        const match = hourStr.match(/^(\d+):(\d{2})$/);
        if (match) {
          totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
        }
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE');
  }

  private getDayName(date: Date): string {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()];
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'open': 'Offen',
      'active': 'Aktiv',
      'completed': 'Abgeschlossen',
      'completed-sent': 'Abgeschlossen (Gesendet)'
    };
    return statusMap[status] || status;
  }

  public getWorksheet(): (string | number | null)[][] {
    return this.rows;
  }
}