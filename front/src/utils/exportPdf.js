import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportReportToPdf({ elementId, filename }) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target not found: ${elementId}`);
  }

  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  try {
    const bodyBg = getComputedStyle(document.body).backgroundColor || '#ffffff';
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: bodyBg,
      windowWidth: document.documentElement.clientWidth,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let offsetY = 0;
    while (offsetY < imgHeight) {
      pdf.addImage(imgData, 'PNG', 0, -offsetY, imgWidth, imgHeight, undefined, 'FAST');
      offsetY += pageHeight;
      if (offsetY < imgHeight) {
        pdf.addPage();
      }
    }

    pdf.save(filename);
  } finally {
    window.scrollTo(0, originalScrollY);
  }
}
