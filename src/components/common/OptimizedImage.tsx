import Image, { type ImageProps } from 'next/image';
import type { CSSProperties, ImgHTMLAttributes } from 'react';

type NativeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'loading' | 'ref'> & {
  src: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  loading?: ImageProps['loading'];
  fetchPriority?: ImageProps['fetchPriority'];
  priority?: boolean;
  sizes?: string;
};

const SUPABASE_PUBLIC_STORAGE = '/storage/v1/object/public/';

function numericDimension(value: NativeImageProps['width'] | NativeImageProps['height']) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

function supabaseStorageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!src.includes(SUPABASE_PUBLIC_STORAGE)) return src;

  const url = new URL(src);
  url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  url.searchParams.set('width', String(width));
  url.searchParams.set('quality', String(quality ?? 75));
  url.searchParams.set('format', 'webp');
  return url.toString();
}

function imageObjectFit(className?: string): CSSProperties['objectFit'] {
  if (className?.includes('object-contain')) return 'contain';
  if (className?.includes('object-fill')) return 'fill';
  if (className?.includes('object-scale-down')) return 'scale-down';
  if (className?.includes('object-none')) return 'none';
  return 'cover';
}

export default function OptimizedImage({
  alt,
  className,
  fetchPriority,
  height,
  loading,
  priority,
  sizes,
  src,
  style,
  width,
  ...props
}: NativeImageProps) {
  const imageWidth = numericDimension(width);
  const imageHeight = numericDimension(height);
  const imagePriority = priority ?? (fetchPriority === 'high');
  const imageLoading = imagePriority ? undefined : (loading ?? 'lazy');

  if (imageWidth && imageHeight) {
    return (
      <Image
        {...props}
        alt={alt ?? ''}
        className={className}
        height={imageHeight}
        loader={supabaseStorageLoader}
        loading={imageLoading}
        priority={imagePriority}
        quality={75}
        sizes={sizes ?? `${imageWidth}px`}
        src={src}
        style={style}
        width={imageWidth}
      />
    );
  }

  return (
    <span className={`relative block overflow-hidden ${className ?? ''}`} style={style}>
      <Image
        {...props}
        alt={alt ?? ''}
        className="h-full w-full"
        fill
        loader={supabaseStorageLoader}
        loading={imageLoading}
        priority={imagePriority}
        quality={75}
        sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
        src={src}
        style={{ objectFit: imageObjectFit(className) }}
      />
    </span>
  );
}
