import * as XLSX from 'xlsx';

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
  private worksheet: XLSX.WorkSheet;
  private currentRow: number = 1;

  constructor() {
    this.worksheet = XLSX.utils.aoa_to_sheet([]);
    this.initializeTemplate();
  }

  private initializeTemplate() {
    // Header-Bereich (Zeilen 1-3)
    this.addMergedCell('A1:M1', 'ARBEITSZEIT-NACHWEIS', 'header');
    
    // Auftraggeber links positioniert
    this.setCellValue('A2', 'Auftraggeber:', 'label');
    this.addMergedCell('B2:E2', '', 'input');
    this.setCellValue('A3', 'Evatic-Nr.:', 'label');
    this.addMergedCell('B3:E3', '', 'input');
    
    // Erste Tabelle - Anreise (Zeilen 5-8)
    this.setCellValue('A5', 'ANREISE', 'sectionHeader');
    this.setCellValue('A6', 'DATUM', 'tableHeader');
    this.setCellValue('B6', 'TAG', 'tableHeader');
    this.setCellValue('C6', 'START', 'tableHeader');
    this.setCellValue('D6', 'ENDE', 'tableHeader');
    this.setCellValue('E6', 'STUNDEN', 'tableHeader');
    
    // Zweite Tabelle - Arbeitszeit (Zeilen 10-15)
    this.setCellValue('A10', 'ARBEITSZEIT', 'sectionHeader');
    this.setCellValue('A11', 'DATUM', 'tableHeader');
    this.setCellValue('B11', 'TAG', 'tableHeader');
    this.setCellValue('C11', 'VON', 'tableHeader');
    this.setCellValue('D11', 'BIS', 'tableHeader');
    this.setCellValue('E11', 'PAUSE', 'tableHeader');
    this.setCellValue('F11', 'STUNDEN', 'tableHeader');
    
    // Dritte Tabelle - Abreise (Zeilen 17-20)
    this.setCellValue('A17', 'ABREISE', 'sectionHeader');
    this.setCellValue('A18', 'DATUM', 'tableHeader');
    this.setCellValue('B18', 'TAG', 'tableHeader');
    this.setCellValue('C18', 'START', 'tableHeader');
    this.setCellValue('D18', 'ENDE', 'tableHeader');
    this.setCellValue('E18', 'STUNDEN', 'tableHeader');
    
    // Zusammenfassung rechts (Zeilen 5-20)
    this.setCellValue('I5', 'ZUSAMMENFASSUNG', 'sectionHeader');
    this.setCellValue('I6', 'Anreisestunden:', 'label');
    this.setCellValue('L6', '', 'summaryValue');
    this.setCellValue('I7', 'Arbeitsstunden:', 'label');
    this.setCellValue('L7', '', 'summaryValue');
    this.setCellValue('I8', 'Abreisestunden:', 'label');
    this.setCellValue('L8', '', 'summaryValue');
    this.setCellValue('I9', 'Gesamtstunden:', 'totalLabel');
    this.setCellValue('L9', '', 'totalValue');
    
    // Status und weitere Infos
    this.setCellValue('I11', 'Zeitraum:', 'label');
    this.setCellValue('L11', '', 'summaryValue');
    this.setCellValue('I12', 'Status:', 'label');
    this.setCellValue('L12', '', 'summaryValue');
    
    // Nur Bemerkungen-Bereich
    
    // Zusätzliche Infos unten
    this.setCellValue('A22', 'Bemerkungen:', 'label');
    this.addMergedCell('A23:M24', '', 'remarksBox');
  }

  public fillJobData(data: JobTemplateData): XLSX.WorkSheet {
    // Auftraggeber ausfüllen
    this.setCellValue('B2', data.customerName, 'data');
    this.setCellValue('B3', data.evaticNo || data.jobId, 'data');
    
    // Zeitraum und Status
    this.setCellValue('L11', `${this.formatDate(data.startDate)} - ${data.endDate ? this.formatDate(data.endDate) : 'laufend'}`, 'data');
    this.setCellValue('L12', this.getStatusText(data.status), 'data');
    
    // Einträge aufteilen in Kategorien
    const travelEntries = data.dailyEntries.filter(e => e.travelStart || e.travelEnd);
    const workEntries = data.dailyEntries.filter(e => e.workStart || e.workEnd);
    const departureEntries = data.dailyEntries.filter(e => e.departureStart || e.departureEnd);
    
    // Anreise-Einträge ab Zeile 7
    let row = 7;
    travelEntries.forEach((entry) => {
      this.setCellValue(`A${row}`, this.formatDate(entry.date), 'tableData');
      this.setCellValue(`B${row}`, this.getDayName(entry.date), 'tableData');
      this.setCellValue(`C${row}`, entry.travelStart || '', 'tableData');
      this.setCellValue(`D${row}`, entry.travelEnd || '', 'tableData');
      this.setCellValue(`E${row}`, this.calculateHours(entry.travelStart, entry.travelEnd), 'tableData');
      row++;
    });
    
    // Arbeitszeit-Einträge ab Zeile 12
    row = 12;
    workEntries.forEach((entry) => {
      this.setCellValue(`A${row}`, this.formatDate(entry.date), 'tableData');
      this.setCellValue(`B${row}`, this.getDayName(entry.date), 'tableData');
      this.setCellValue(`C${row}`, entry.workStart || '', 'tableData');
      this.setCellValue(`D${row}`, entry.workEnd || '', 'tableData');
      this.setCellValue(`E${row}`, entry.breakTime || '', 'tableData');
      this.setCellValue(`F${row}`, this.calculateHours(entry.workStart, entry.workEnd, entry.breakTime), 'tableData');
      row++;
    });
    
    // Abreise-Einträge ab Zeile 19
    row = 19;
    departureEntries.forEach((entry) => {
      this.setCellValue(`A${row}`, this.formatDate(entry.date), 'tableData');
      this.setCellValue(`B${row}`, this.getDayName(entry.date), 'tableData');
      this.setCellValue(`C${row}`, entry.departureStart || '', 'tableData');
      this.setCellValue(`D${row}`, entry.departureEnd || '', 'tableData');
      this.setCellValue(`E${row}`, this.calculateHours(entry.departureStart, entry.departureEnd), 'tableData');
      row++;
    });
    
    // Zusammenfassung berechnen
    const travelHours = this.sumHours(travelEntries.map(e => this.calculateHours(e.travelStart, e.travelEnd)));
    const workHours = this.sumHours(workEntries.map(e => this.calculateHours(e.workStart, e.workEnd, e.breakTime)));
    const departureHours = this.sumHours(departureEntries.map(e => this.calculateHours(e.departureStart, e.departureEnd)));
    
    this.setCellValue('L6', travelHours, 'summaryData');
    this.setCellValue('L7', workHours, 'summaryData');
    this.setCellValue('L8', departureHours, 'summaryData');
    this.setCellValue('L9', data.totalHours, 'totalData');
    
    // Keine Unterschrift mehr benötigt
    
    this.applyFormatting();
    return this.worksheet;
  }

  private setCellValue(cell: string, value: string, style?: string) {
    if (!this.worksheet[cell]) {
      this.worksheet[cell] = {};
    }
    this.worksheet[cell].v = value;
    this.worksheet[cell].t = 's';
    
    if (style) {
      this.applyCellStyle(cell, style);
    }
  }

  private addMergedCell(range: string, value: string, style?: string) {
    const startCell = range.split(':')[0];
    this.setCellValue(startCell, value, style);
    
    if (!this.worksheet['!merges']) {
      this.worksheet['!merges'] = [];
    }
    this.worksheet['!merges'].push(XLSX.utils.decode_range(range));
  }

  private applyCellStyle(cell: string, style: string) {
    if (!this.worksheet[cell].s) {
      this.worksheet[cell].s = {};
    }
    
    const styles = {
      header: {
        font: { bold: true, size: 16, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: '366092' } }
      },
      sectionHeader: {
        font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: '4472C4' } },
        border: this.getAllBorders()
      },
      tableHeader: {
        font: { bold: true, size: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'D9E2F3' } },
        border: this.getAllBorders()
      },
      tableData: {
        font: { size: 9 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this.getAllBorders()
      },
      label: {
        font: { bold: true, size: 9 },
        alignment: { horizontal: 'left', vertical: 'center' }
      },
      data: {
        font: { size: 9 },
        alignment: { horizontal: 'left', vertical: 'center' }
      },
      summaryValue: {
        font: { size: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this.getAllBorders(),
        fill: { fgColor: { rgb: 'F2F2F2' } }
      },
      summaryData: {
        font: { bold: true, size: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this.getAllBorders()
      },
      totalLabel: {
        font: { bold: true, size: 11 },
        alignment: { horizontal: 'left', vertical: 'center' },
        fill: { fgColor: { rgb: 'FFFF00' } }
      },
      totalValue: {
        font: { bold: true, size: 12 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'FFFF00' } },
        border: this.getAllBorders('medium')
      },
      totalData: {
        font: { bold: true, size: 11 },
        alignment: { horizontal: 'center', vertical: 'center' }
      },
      input: {
        border: this.getAllBorders(),
        fill: { fgColor: { rgb: 'FFFFFF' } }
      },
      // Signature styles removed
      remarksBox: {
        border: this.getAllBorders(),
        fill: { fgColor: { rgb: 'F8F8F8' } }
      }
    };
    
    Object.assign(this.worksheet[cell].s, styles[style as keyof typeof styles] || {});
  }

  private getAllBorders(weight: 'thin' | 'medium' = 'thin') {
    return {
      top: { style: weight, color: { rgb: '000000' } },
      bottom: { style: weight, color: { rgb: '000000' } },
      left: { style: weight, color: { rgb: '000000' } },
      right: { style: weight, color: { rgb: '000000' } }
    };
  }

  private applyFormatting() {
    // Spaltenbreiten setzen
    this.worksheet['!cols'] = [
      { wch: 12 }, // A - Datum
      { wch: 6 },  // B - Tag  
      { wch: 8 },  // C - Von/Start
      { wch: 8 },  // D - Bis/Ende
      { wch: 8 },  // E - Pause/Stunden
      { wch: 10 }, // F - Stunden/Beschreibung
      { wch: 25 }, // G - Beschreibung
      { wch: 2 },  // H - Leer
      { wch: 15 }, // I - Labels
      { wch: 2 },  // J - Leer
      { wch: 2 },  // K - Leer
      { wch: 15 }, // L - Werte
      { wch: 15 }  // M - Zusatz
    ];
    
    // Zeilenhöhen
    this.worksheet['!rows'] = Array(30).fill({ hpt: 18 });
    this.worksheet['!rows'][0] = { hpt: 25 }; // Header größer
  }

  private calculateHours(startTime?: string, endTime?: string, breakTime?: string): string {
    if (!startTime || !endTime) return '';
    
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    const breakMinutes = breakTime ? this.parseBreakTime(breakTime) : 0;
    
    if (start && end) {
      let diffMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // Über Mitternacht
      diffMinutes -= breakMinutes;
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return '';
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } | null {
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return { hours: parseInt(match[1]), minutes: parseInt(match[2]) };
    }
    return null;
  }

  private parseBreakTime(breakStr: string): number {
    const match = breakStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private sumHours(hourStrings: string[]): string {
    let totalMinutes = 0;
    hourStrings.forEach(hourStr => {
      const match = hourStr.match(/(\d+):(\d+)/);
      if (match) {
        totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE');
  }

  private getDayName(date: Date): string {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[new Date(date).getDay()];
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'open': return 'Offen';
      case 'active': return 'Aktiv';
      case 'completed': return 'Abgeschlossen';
      case 'completed-sent': return 'Abgeschlossen & Gesendet';
      case 'pending': return 'Ausstehend';
      default: return status;
    }
  }

  public getWorksheet(): XLSX.WorkSheet {
    return this.worksheet;
  }
}