/**
 * Dynamic loader for exceljs to prevent eager loading
 */

let excelljsModule: typeof import('exceljs') | null = null;

export async function loadExcel() {
  if (!excelljsModule) {
    excelljsModule = await import('exceljs');
  }
  return excelljsModule;
}

export async function getExcelJS() {
  const module = await loadExcel();
  return module.default;
}