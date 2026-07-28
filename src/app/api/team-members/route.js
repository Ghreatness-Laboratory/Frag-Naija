import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { createTeamMember, getTeamMembers } from '@/features/teamMembers.server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === '1';
    return NextResponse.json(await getTeamMembers({ status: all ? '' : 'Published' }), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    return NextResponse.json(await createTeamMember(await request.json()), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
