/**
 * Dynamic jsPDF loader
 * Keeps jsPDF out of initial bundle for better performance
 */

let pdfPromise: Promise<any> | null = null;

export async function loadPdf() {
  if (pdfPromise) {
    return pdfPromise;
  }

  pdfPromise = import('jspdf').then((jsPdfModule) => {
    return jsPdfModule;
  });

  return pdfPromise;
}
