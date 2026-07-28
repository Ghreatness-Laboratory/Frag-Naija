import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { deleteTeamMember, updateTeamMember } from '@/features/teamMembers.server';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    return NextResponse.json(await updateTeamMember(params.id, await request.json()));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    await deleteTeamMember(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
