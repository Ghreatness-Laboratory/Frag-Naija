import { NextResponse } from 'next/server';
import { deleteHighlight } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function DELETE(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    await deleteHighlight(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
