import { NextResponse } from 'next/server';
import { getHighlights, createHighlight } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = { category: searchParams.get('category') || '' };
    const data = await getHighlights(filters);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await createHighlight(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
