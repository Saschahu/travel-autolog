import ExcelJS from 'exceljs';
import { JobTemplateData } from './ExcelTemplate';

export async function generateSingleJobTemplateBuffer(data: JobTemplateData): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Arbeitszeit-Nachweis', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
    properties: { defaultRowHeight: 18 }
  });

  // Column widths
  ws.columns = [
    { header: '', key: 'A', width: 12 },
    { header: '', key: 'B', width: 6 },
    { header: '', key: 'C', width: 9 },
    { header: '', key: 'D', width: 9 },
    { header: '', key: 'E', width: 9 },
    { header: '', key: 'F', width: 12 },
    { header: '', key: 'G', width: 2 },
    { header: '', key: 'H', width: 16 },
    { header: '', key: 'I', width: 2 },
    { header: '', key: 'J', width: 2 },
    { header: '', key: 'K', width: 16 },
    { header: '', key: 'L', width: 16 },
    { header: '', key: 'M', width: 16 },
  ];

  const borderThin = { style: 'thin', color: { argb: 'FF000000' } } as const;
  const allThin = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin } as const;

  // Header
  ws.mergeCells('A1:M1');
  const h = ws.getCell('A1');
  h.value = 'ARBEITSZEIT-NACHWEIS';
  h.alignment = { horizontal: 'center', vertical: 'middle' };
  h.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
  ws.getRow(1).height = 24;

  // Auftraggeber / Auftrag (links positioniert)
  ws.getCell('A2').value = 'Auftraggeber:'; ws.getCell('A2').font = { bold: true };
  ws.mergeCells('B2:E2'); ws.getCell('B2').value = data.customerName;
  ws.getCell('A3').value = 'Evatic-Nr.:'; ws.getCell('A3').font = { bold: true };
  ws.mergeCells('B3:E3'); ws.getCell('B3').value = data.evaticNo || data.jobId;

  // Section helper
  const sectionHeader = (cell: string, title: string) => {
    const c = ws.getCell(cell);
    c.value = title;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { horizontal: 'center' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    c.border = allThin;
  };
  const headers = (row: number, labels: string[]) => {
    labels.forEach((label, i) => {
      const c = ws.getCell(row, 1 + i);
      c.value = label;
      c.font = { bold: true };
      c.alignment = { horizontal: 'center' };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      c.border = allThin;
    });
  };
  const addRow = (row: number, values: (string | number)[]) => {
    values.forEach((v, i) => {
      const c = ws.getCell(row, 1 + i);
      c.value = v;
      c.alignment = { horizontal: i >= 2 && i <= 4 ? 'center' : 'left' };
      c.border = allThin;
    });
  };

  // Anreise
  sectionHeader('A5', 'ANREISE');
  headers(6, ['DATUM','TAG','START','ENDE','STUNDEN']);
  let row = 7;
  const travelEntries = data.dailyEntries.filter(e => e.travelStart || e.travelEnd);
  travelEntries.forEach(e => {
    addRow(row++, [formatDate(e.date), dayName(e.date), e.travelStart || '', e.travelEnd || '', diff(e.travelStart, e.travelEnd)]);
  });

  // Arbeitszeit
  sectionHeader('A10', 'ARBEITSZEIT');
  headers(11, ['DATUM','TAG','VON','BIS','PAUSE','STUNDEN']);
  row = 12;
  const workEntries = data.dailyEntries.filter(e => e.workStart || e.workEnd);
  workEntries.forEach(e => {
    addRow(row++, [formatDate(e.date), dayName(e.date), e.workStart || '', e.workEnd || '', e.breakTime || '', diff(e.workStart, e.workEnd, e.breakTime)]);
  });

  // Abreise
  sectionHeader('A17', 'ABREISE');
  headers(18, ['DATUM','TAG','START','ENDE','STUNDEN']);
  row = 19;
  const depEntries = data.dailyEntries.filter(e => e.departureStart || e.departureEnd);
  depEntries.forEach(e => {
    addRow(row++, [formatDate(e.date), dayName(e.date), e.departureStart || '', e.departureEnd || '', diff(e.departureStart, e.departureEnd)]);
  });

  // Summary rechts
  const label = (cell: string, text: string, bold = true) => { const c = ws.getCell(cell); c.value = text; c.font = { bold }; };
  const box = (cell: string, value?: string) => { const c = ws.getCell(cell); c.value = value || ''; c.border = allThin; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; c.alignment = { horizontal: 'center' }; };

  label('I5','ZUSAMMENFASSUNG');
  label('I6','Anreisestunden:'); box('L6', sum(travelEntries.map(e => diff(e.travelStart, e.travelEnd))));
  label('I7','Arbeitsstunden:'); box('L7', sum(workEntries.map(e => diff(e.workStart, e.workEnd, e.breakTime))));
  label('I8','Abreisestunden:'); box('L8', sum(depEntries.map(e => diff(e.departureStart, e.departureEnd))));
  const totalBox = ws.getCell('L9');
  ws.getCell('I9').value = 'Gesamtstunden:'; ws.getCell('I9').font = { bold: true };
  totalBox.value = data.totalHours || sum([
    sum(travelEntries.map(e => diff(e.travelStart, e.travelEnd))),
    sum(workEntries.map(e => diff(e.workStart, e.workEnd, e.breakTime))),
    sum(depEntries.map(e => diff(e.departureStart, e.departureEnd)))
  ]);
  totalBox.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  totalBox.font = { bold: true };
  totalBox.border = allThin;
  totalBox.alignment = { horizontal: 'center' };

  // Zeitraum und Status
  label('I11','Zeitraum:'); box('L11', `${formatDate(data.startDate)} - ${data.endDate ? formatDate(data.endDate) : 'laufend'}`);
  label('I12','Status:'); box('L12', data.status);

  // Remarks
  label('A22','Bemerkungen:', true);
  ws.mergeCells('A23:M24');
  const rem = ws.getCell('A23'); rem.border = allThin; rem.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } };

  // Signature
  label('A25','UNTERSCHRIFT:');
  ws.mergeCells('C25:M25');
  const signatureCell = ws.getCell('C25');
  signatureCell.border = allThin;
  signatureCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } };
  
  if (data.signature) {
    // If signature is provided, add image (this is simplified - ExcelJS would need image handling)
    signatureCell.value = '[Unterschrift]';
    signatureCell.alignment = { horizontal: 'center', vertical: 'middle' };
  } else {
    signatureCell.value = 'Keine Unterschrift hinterlegt';
    signatureCell.alignment = { horizontal: 'center', vertical: 'middle' };
    signatureCell.font = { italic: true, color: { argb: 'FF808080' } };
  }
  
  // Set row height for signature (smaller, more professional)
  ws.getRow(25).height = 40;

  return workbook.xlsx.writeBuffer();
}

function formatDate(d: Date) { return new Date(d).toLocaleDateString('de-DE'); }
function dayName(d: Date) { return ['So','Mo','Di','Mi','Do','Fr','Sa'][new Date(d).getDay()]; }
function minutesOf(t?: string) { if (!t) return null; const m = t.match(/(\d{1,2}):(\d{2})/); return m ? (+m[1] * 60 + +m[2]) : null; }
function parseBreak(b?: string) { if (!b) return 0; const m = b.match(/(\d+)/); return m ? +m[1] : 0; }
function diff(start?: string, end?: string, br?: string) {
  const s = minutesOf(start); const e = minutesOf(end); if (s == null || e == null) return '';
  let mins = e - s; if (mins < 0) mins += 24 * 60; mins -= parseBreak(br);
  const h = Math.floor(mins / 60); const m = mins % 60; return `${h}:${m.toString().padStart(2,'0')}`;
}
function sum(times: string[]) {
  let total = 0; times.forEach(t => { const m = t.match(/(\d+):(\d+)/); if (m) total += (+m[1])*60 + (+m[2]); });
  const h = Math.floor(total/60), m = total%60; return `${h}:${m.toString().padStart(2,'0')}`;
}
