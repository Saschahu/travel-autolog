// src/lib/excelAdapter.ts
import ExcelJS from "exceljs";

export type RowObject = Record<string, string | number | null | undefined>;

export async function readWorkbook(file: File): Promise<RowObject[]> {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const ws = wb.worksheets[0];
  if (!ws) return [];

  // Erste Zeile = Header
  const headers: string[] = [];
  ws.getRow(1).eachCell((cell, col) => {
    headers[col - 1] = String(cell.value ?? `col_${col}`);
  });

  const rows: RowObject[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: RowObject = {};
    row.eachCell((cell, col) => {
      const key = headers[col - 1] ?? `col_${col}`;
      const v = cell.value;
      obj[key] = typeof v === "object" && v !== null && "text" in (v as any)
        ? (v as any).text
        : (v as any);
    });
    rows.push(obj);
  });
  return rows;
}

export async function exportWorkbook(
  rows: RowObject[],
  filename = "export.xlsx"
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Data");

  // Header aus Keys der ersten Zeile
  const keys = rows.length ? Object.keys(rows[0]) : [];
  if (keys.length) ws.addRow(keys);

  for (const r of rows) {
    ws.addRow(keys.map(k => r[k] ?? ""));
  }

  // simple AutoWidth
  ws.columns?.forEach(col => {
    let max = 10;
    col.eachCell(c => {
      const len = String(c.value ?? "").length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 60);
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}