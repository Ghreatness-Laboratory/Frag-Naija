import { NextResponse } from 'next/server';
import { getOrganizations, createOrganization } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json(await getOrganizations()); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try { return NextResponse.json(await createOrganization(await request.json()), { status: 201 }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
