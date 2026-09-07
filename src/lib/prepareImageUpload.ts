const STATIC_ASSET_BUCKETS = new Set(['teams', 'partners']);

const MAX_DIMENSION_BY_BUCKET: Record<string, number> = {
  athletes: 1200,
  teams: 1200,
  partners: 1200,
  highlights: 1200,
  'team-members': 800,
  'shop-items': 1200,
  news: 1600,
  'wager-proofs': 1600,
};

/**
 * Converts raster uploads to WebP before they leave the browser. Storage image
 * transformations are unavailable on the current plan, so this keeps the
 * original object reasonably sized for both Next/Image and direct requests.
 */
export async function prepareImageUpload(file: File, bucket: string): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  const maxDimension = MAX_DIMENSION_BY_BUCKET[bucket] ?? 1200;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) throw new Error('Could not optimize the selected image.');

  const filename = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${filename}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

export function imageCacheControl(bucket: string) {
  return STATIC_ASSET_BUCKETS.has(bucket)
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=2592000';
}
