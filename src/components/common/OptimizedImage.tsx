import Image, { type ImageProps } from 'next/image';

/** Storage transformations are unavailable; Next's image optimizer provides responsive derivatives. */
export function supabaseImageUrl(src: string) {
  const cdnUrl = process.env.NEXT_PUBLIC_STORAGE_CDN_URL?.replace(/\/$/, '');
  if (!cdnUrl || !src.includes(STORAGE_PUBLIC_PATH)) return src;

  try {
    const source = new URL(src);
    const storagePathIndex = source.pathname.indexOf(STORAGE_PUBLIC_PATH);
    if (storagePathIndex === -1) return src;
    return `${cdnUrl}${source.pathname.slice(storagePathIndex)}${source.search}`;
  } catch {
    return src;
  }
}

type OptimizedImageProps = Omit<ImageProps, 'src'> & {
  src: string;
  alt: string;
};

export default function OptimizedImage({
  src,
  width = 320,
  height = 240,
  unoptimized,
  loading = 'lazy',
  alt,
  ...props
}: OptimizedImageProps) {
  const imageSrc = supabaseImageUrl(src);
  const shouldBypassOptimization = unoptimized || imageSrc.endsWith('.svg') || imageSrc.startsWith('blob:') || imageSrc.startsWith('data:');

  return (
    <Image
      {...props}
      src={imageSrc}
      width={width}
      height={height}
      alt={alt}
      loading={loading}
      unoptimized={shouldBypassOptimization}
    />
  );
}
