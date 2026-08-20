import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { createStakeholder, deleteStakeholder, listStakeholders, updateStakeholder } from '@/features/stakeholders.server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get('admin') === '1';
  if (admin) {
    const authErr = await checkAdmin();
    if (authErr) return authErr;
  }
  return NextResponse.json(await listStakeholders({ includeDrafts: admin }), {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    return NextResponse.json(await createStakeholder(await request.json()));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    const body = await request.json();
    return NextResponse.json(await updateStakeholder(body.id, body));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json(await deleteStakeholder(searchParams.get('id')));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
