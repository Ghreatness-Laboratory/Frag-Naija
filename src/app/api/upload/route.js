import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { checkAdmin } from '@/features/shared/server/adminAuth';

export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS = ['athletes', 'teams', 'highlights'];
const MAX_SIZE_MB = 10;

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
    const buffer = Buffer.from(bytes);

    if (buffer.byteLength > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_SIZE_MB}MB limit` },
        { status: 413 }
      );
    }

    const ext      = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
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
