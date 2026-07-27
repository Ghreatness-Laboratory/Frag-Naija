export default async function html2canvas(element: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  const clone = element.cloneNode(true) as HTMLElement;

  inlineComputedStyles(element, clone);

  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">${serialized}</foreignObject>
    </svg>
  `;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = await loadSvg(url);
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas rendering is unavailable');
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function inlineComputedStyles(source: Element, target: Element) {
  if (source instanceof HTMLElement && target instanceof HTMLElement) {
    const computed = window.getComputedStyle(source);
    for (const property of Array.from(computed)) {
      target.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
    }
  }

  Array.from(source.children).forEach((sourceChild, index) => {
    const targetChild = target.children[index];
    if (targetChild) inlineComputedStyles(sourceChild, targetChild);
  });
}

function loadSvg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to render player card image'));
    image.src = src;
  });
}
