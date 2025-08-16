import * as XLSX from 'xlsx';

export interface JobTemplateData {
  customerName: string;
  jobId: string;
  startDate: Date;
  endDate?: Date;
  dailyEntries: Array<{
    date: Date;
    workStart?: string;
    workEnd?: string;
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
    // Header-Bereich (Zeilen 1-5)
    this.addMergedCell('A1:G1', 'ARBEITSZEIT-NACHWEIS', 'header');
    this.addMergedCell('A2:G2', '', 'subheader');
    
    // Auftraggeber-Bereich (rechts oben)
    this.setCellValue('I1', 'AUFTRAGGEBER:', 'label');
    this.addMergedCell('I2:L2', '', 'input');
    this.setCellValue('I3', 'AUFTRAG-NR:', 'label');
    this.addMergedCell('I4:L4', '', 'input');
    
    // Haupttabelle Header (Zeile 6)
    this.setCellValue('A6', 'DATUM', 'tableHeader');
    this.setCellValue('B6', 'TAG', 'tableHeader');
    this.setCellValue('C6', 'VON', 'tableHeader');
    this.setCellValue('D6', 'BIS', 'tableHeader');
    this.setCellValue('E6', 'PAUSE', 'tableHeader');
    this.setCellValue('F6', 'STUNDEN', 'tableHeader');
    this.setCellValue('G6', 'TÄTIGKEITSBESCHREIBUNG', 'tableHeader');
    
    // Zusammenfassung rechts
    this.setCellValue('I6', 'GESAMTSTUNDEN:', 'label');
    this.addMergedCell('K6:L6', '', 'totalHours');
    
    // Unterschrift-Bereich (unten)
    this.setCellValue('A25', 'AUFTRAGNEHMER:', 'label');
    this.addMergedCell('C25:E25', '', 'signature');
    this.setCellValue('A26', 'Datum/Unterschrift', 'small');
    
    this.setCellValue('G25', 'AUFTRAGGEBER:', 'label');
    this.addMergedCell('I25:L25', '', 'signature');
    this.setCellValue('G26', 'Datum/Unterschrift', 'small');
  }

  public fillJobData(data: JobTemplateData): XLSX.WorkSheet {
    // Auftraggeber ausfüllen
    this.setCellValue('I2', data.customerName, 'data');
    this.setCellValue('I4', data.jobId, 'data');
    
    // Gesamtstunden
    this.setCellValue('K6', data.totalHours, 'totalData');
    
    // Tägliche Einträge ab Zeile 7
    let row = 7;
    data.dailyEntries.forEach((entry, index) => {
      this.setCellValue(`A${row}`, this.formatDate(entry.date), 'tableData');
      this.setCellValue(`B${row}`, this.getDayName(entry.date), 'tableData');
      this.setCellValue(`C${row}`, entry.workStart || '', 'tableData');
      this.setCellValue(`D${row}`, entry.workEnd || '', 'tableData');
      this.setCellValue(`E${row}`, entry.breakTime || '', 'tableData');
      this.setCellValue(`F${row}`, entry.totalHours || '', 'tableData');
      this.setCellValue(`G${row}`, entry.description || '', 'tableData');
      row++;
    });
    
    // Status und Fortschritt
    this.setCellValue('I8', 'STATUS:', 'label');
    this.setCellValue('K8', this.getStatusText(data.status), 'data');
    this.setCellValue('I9', 'FORTSCHRITT:', 'label');
    this.setCellValue('K9', `${data.currentDay}/${data.estimatedDays} Tage`, 'data');
    
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
        font: { bold: true, size: 16 },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: '366092' } }
      },
      subheader: {
        font: { bold: true, size: 12 },
        fill: { fgColor: { rgb: 'D9E2F3' } }
      },
      tableHeader: {
        font: { bold: true, size: 10 },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: 'E7E6E6' } },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      },
      tableData: {
        font: { size: 9 },
        alignment: { horizontal: 'left' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      },
      label: {
        font: { bold: true, size: 9 }
      },
      data: {
        font: { size: 9 }
      },
      totalHours: {
        font: { bold: true, size: 11 },
        fill: { fgColor: { rgb: 'FFFF00' } },
        border: {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'medium' },
          right: { style: 'medium' }
        }
      },
      totalData: {
        font: { bold: true, size: 11 }
      },
      signature: {
        border: {
          bottom: { style: 'thin' }
        }
      },
      small: {
        font: { size: 8 },
        alignment: { horizontal: 'center' }
      }
    };
    
    Object.assign(this.worksheet[cell].s, styles[style as keyof typeof styles] || {});
  }

  private applyFormatting() {
    // Spaltenbreiten setzen
    this.worksheet['!cols'] = [
      { wch: 12 }, // A - Datum
      { wch: 8 },  // B - Tag  
      { wch: 8 },  // C - Von
      { wch: 8 },  // D - Bis
      { wch: 8 },  // E - Pause
      { wch: 10 }, // F - Stunden
      { wch: 30 }, // G - Beschreibung
      { wch: 2 },  // H - Leer
      { wch: 15 }, // I - Labels
      { wch: 2 },  // J - Leer
      { wch: 15 }, // K - Werte
      { wch: 15 }  // L - Zusatz
    ];
    
    // Zeilenhöhen
    this.worksheet['!rows'] = Array(30).fill({ hpt: 15 });
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