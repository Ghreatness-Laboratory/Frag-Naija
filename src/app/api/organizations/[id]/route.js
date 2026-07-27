import { NextResponse } from 'next/server';
import { getOrganizationById, updateOrganization, deleteOrganization } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try { return NextResponse.json(await getOrganizationById(params.id)); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 404 }); }
}

export async function PUT(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try { return NextResponse.json(await updateOrganization(params.id, await request.json())); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(_request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try { await deleteOrganization(params.id); return NextResponse.json({ deleted: true }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
