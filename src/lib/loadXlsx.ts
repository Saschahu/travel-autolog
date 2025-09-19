/**
 * Dynamic loader for xlsx to prevent eager loading
 */

let xlsxModule: typeof import('xlsx') | null = null;

export async function loadXlsx() {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
}

export async function getXLSX() {
  const module = await loadXlsx();
  return module;
}