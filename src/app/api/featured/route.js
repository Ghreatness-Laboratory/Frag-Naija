import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getFeatured, createFeatured } from '@/features/featured/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let opts = { activeOnly: true };
    if (searchParams.get('all') === '1') {
      const authErr = await checkAdmin();
      if (!authErr) opts = {};
    }
    const data = await getFeatured(opts);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await createFeatured(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
