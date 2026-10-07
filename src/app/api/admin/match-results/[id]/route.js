import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { deleteMatchResultAlert } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;
  try {
    if (!params?.id) return NextResponse.json({ error: 'match result id is required' }, { status: 400 });
    const result = await deleteMatchResultAlert(params.id);
    return NextResponse.json(result);
  } catch (error) {
    const status = String(error?.code || '') === 'P0002' ? 404 : 500;
    return NextResponse.json({ error: error.message || 'Unable to delete match result.' }, { status });
  }
}
