/**
 * Dynamic loader for jsPDF to prevent eager loading
 */

let jsPdfModule: typeof import('jspdf') | null = null;

export async function loadPdf() {
  if (!jsPdfModule) {
    jsPdfModule = await import('jspdf');
  }
  return jsPdfModule;
}

export async function getJsPDF() {
  const module = await loadPdf();
  return module.jsPDF;
}

export async function getJsPDFDefault() {
  const module = await loadPdf();
  return module.default;
}