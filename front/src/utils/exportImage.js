import html2canvas from 'html2canvas';

export async function exportElementToPng({ elementId, filename }) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target not found: ${elementId}`);
  }

  const bodyBg = getComputedStyle(document.body).backgroundColor || '#ffffff';
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: bodyBg,
    windowWidth: document.documentElement.clientWidth,
  });

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}
