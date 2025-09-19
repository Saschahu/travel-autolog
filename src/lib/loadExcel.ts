/**
 * Lazy loader for ExcelJS library
 * This prevents exceljs from being included in the initial bundle
 */
export async function loadExcel() {
  const excelModule = await import('exceljs');
  return excelModule.default;
}