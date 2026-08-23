import Image, { type ImageProps } from 'next/image';

function isSupabaseStorageUrl(value: string) {
  return value.includes('/storage/v1/object/public/');
}

/**
 * Storage public URLs must be requested directly. Supabase's render endpoint
 * requires the Image Transformations feature, which is not enabled here.
 */
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
  alt,
  ...props
}: OptimizedImageProps) {
  const isSupabaseStorageImage = isSupabaseStorageUrl(src);
  const imageSrc = supabaseImageUrl(src);
  const shouldBypassOptimization = unoptimized || isSupabaseStorageImage || imageSrc.endsWith('.svg') || imageSrc.startsWith('blob:') || imageSrc.startsWith('data:');

  return (
    <Image
      {...props}
      src={imageSrc}
      width={width}
      height={height}
      alt={alt}
      unoptimized={shouldBypassOptimization}
    />
  );
}
