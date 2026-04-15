import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getFeaturedById, updateFeatured, deleteFeatured } from '@/features/featured/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const data = await getFeaturedById(params.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await updateFeatured(params.id, body);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    await deleteFeatured(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
