import html2canvas from 'html2canvas';
import { loadPdf } from '@/lib/loaders/loadPdf';

/** Erzeugt ein A4-PDF aus einem DOM-Element, stark komprimiert */
export async function makeReportPdf(
  el: HTMLElement,
  opts?: { quality?: number; scale?: number }
): Promise<Blob> {
  const quality = opts?.quality ?? 0.6; // 60% JPEG-Qualität
  const scale = opts?.scale ?? 2;       // ~150–180 dpi: scharf & klein

  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false
  });

  // JPEG statt PNG spart massiv Speicherplatz
  const imgData = canvas.toDataURL('image/jpeg', quality);

  const { jsPDF } = await loadPdf();
  const pdf = new jsPDF({ 
    orientation: 'portrait', 
    unit: 'mm', 
    format: 'a4', 
    compress: true 
  });
  
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  // Erste Seite
  pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH, undefined, 'FAST');

  // Weitere Seiten, falls der Inhalt höher als A4 ist
  let heightLeft = imgH - pageH;
  while (heightLeft > 0) {
    pdf.addPage();
    // y-Versatz negativ: „verschiebt" das große Bild nach oben
    pdf.addImage(imgData, 'JPEG', 0, -heightLeft, imgW, imgH, undefined, 'FAST');
    heightLeft -= pageH;
  }

  return pdf.output('blob');
}

/** Optional: PNG-DataURL zu JPEG umwandeln (für Logos/Signaturen) */
export function pngToJpeg(dataUrlPng: string, q = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; 
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      
      // Weißer Hintergrund für JPEG (da JPEG kein Alpha unterstützt)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      
      resolve(c.toDataURL('image/jpeg', q));
    };
    img.src = dataUrlPng;
  });
}