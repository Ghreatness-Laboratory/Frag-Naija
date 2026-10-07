import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { checkAdmin } from '@/features/shared/server/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // sharp needs the Node runtime

const ALLOWED_BUCKETS = ['athletes', 'teams', 'partners', 'highlights', 'team-members', 'shop-items', 'news', 'wager-proofs'];
const MAX_SIZE_MB = 10;
const STATIC_ASSET_BUCKETS = new Set(['teams', 'partners']);

// Image processing settings
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;
// Keep originals untouched in these buckets (e.g. proof screenshots)
const NO_RESIZE_BUCKETS = new Set(['wager-proofs']);
// Never convert these types (vector/animated images)
const NO_CONVERT_TYPES = new Set(['image/svg+xml', 'image/gif']);

function imageCacheControl(bucket) {
  return STATIC_ASSET_BUCKETS.has(bucket)
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=2592000';
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const formData = await request.formData();
    const file   = formData.get('file');
    const bucket = formData.get('bucket') || 'highlights';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: `bucket must be one of: ${ALLOWED_BUCKETS.join(', ')}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    if (buffer.byteLength > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_SIZE_MB}MB limit` },
        { status: 413 }
      );
    }

    let ext = file.name.split('.').pop();
    let contentType = file.type;

    // Resize + convert to WebP, only for raster images.
    // Videos and other files (e.g. in "highlights") pass through untouched.
    const shouldProcess =
      file.type?.startsWith('image/') &&
      !NO_CONVERT_TYPES.has(file.type) &&
      !NO_RESIZE_BUCKETS.has(bucket);

    if (shouldProcess) {
      try {
        buffer = await sharp(buffer)
          .rotate() // respect phone camera orientation
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();
        ext = 'webp';
        contentType = 'image/webp';
      } catch (imgErr) {
        // If processing fails, fall back to uploading the original
        console.error('Image processing failed, uploading original:', imgErr);
      }
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType,
        cacheControl: imageCacheControl(bucket),
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl, filename });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
