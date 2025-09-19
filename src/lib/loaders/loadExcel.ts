/**
 * Dynamic ExcelJS loader
 * Keeps ExcelJS out of initial bundle for better performance
 */

let excelPromise: Promise<any> | null = null;

export async function loadExcel() {
  if (excelPromise) {
    return excelPromise;
  }

  excelPromise = import('exceljs').then((excelModule) => {
    return excelModule;
  });

  return excelPromise;
}
