import Image, { type ImageProps } from 'next/image';

const DEFAULT_QUALITY = 72;

function isSupabaseStorageUrl(value: string) {
  return value.includes('/storage/v1/object/public/');
}

export function supabaseImageUrl(src: string, width?: number, height?: number, quality = DEFAULT_QUALITY) {
  if (!isSupabaseStorageUrl(src)) return src;
  try {
    const url = new URL(src);
    url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    if (width) url.searchParams.set('width', String(width));
    if (height) url.searchParams.set('height', String(height));
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('resize', 'cover');
    return url.toString();
  } catch {
    return src;
  }
}

type OptimizedImageProps = Omit<ImageProps, 'src'> & {
  src: string;
  transformWidth?: number;
  transformHeight?: number;
  transformQuality?: number;
  alt: string;
};

export default function OptimizedImage({
  src,
  width = 320,
  height = 240,
  transformWidth,
  transformHeight,
  transformQuality = DEFAULT_QUALITY,
  unoptimized,
  alt,
  ...props
}: OptimizedImageProps) {
  const isSupabaseStorageImage = isSupabaseStorageUrl(src);
  const transformedSrc = supabaseImageUrl(src, transformWidth ?? Number(width), transformHeight ?? Number(height), transformQuality);
  const shouldBypassOptimization = unoptimized || isSupabaseStorageImage || transformedSrc.endsWith('.svg') || transformedSrc.startsWith('blob:') || transformedSrc.startsWith('data:');

  return (
    <Image
      {...props}
      src={transformedSrc}
      width={width}
      height={height}
      alt={alt}
      quality={transformQuality}
      unoptimized={shouldBypassOptimization}
    />
  );
}
