/**
 * Lazy loader for jsPDF library
 * This prevents jspdf from being included in the initial bundle
 */
export async function loadPdf() {
  const jspdfModule = await import('jspdf');
  return jspdfModule.default;
}