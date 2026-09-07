import Image, { type ImageProps } from 'next/image';

/** Storage transformations are unavailable; Next's image optimizer provides responsive derivatives. */
export function supabaseImageUrl(src: string) {
  return src;
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
