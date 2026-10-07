export default async function html2canvas(element: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  const { svg, width, height } = await serializeElementAsSvg(element);
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

export async function elementToSvgDataUrl(element: HTMLElement): Promise<string> {
  const { svg } = await serializeElementAsSvg(element);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function serializeElementAsSvg(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  const clone = element.cloneNode(true) as HTMLElement;

  inlineComputedStyles(element, clone);
  await inlineImageSources(element, clone);

  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">${serialized}</foreignObject>
    </svg>
  `;

  return { svg, width, height };
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

async function inlineImageSources(source: Element, target: Element) {
  const sourceImages = Array.from(source.querySelectorAll('img'));
  const targetImages = Array.from(target.querySelectorAll('img'));

  await Promise.all(sourceImages.map(async (sourceImage, index) => {
    const targetImage = targetImages[index];
    const src = sourceImage.currentSrc || sourceImage.src;
    if (!targetImage || !src || src.startsWith('data:')) return;

    targetImage.removeAttribute('srcset');

    try {
      targetImage.src = await imageToDataUrl(src);
    } catch {
      targetImage.removeAttribute('src');
      targetImage.style.visibility = 'hidden';
    }
  }));
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src, { mode: 'cors', credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Unable to fetch image: ${src}`);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to encode image'));
    reader.readAsDataURL(blob);
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
