import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { adminUpdateWithdrawal } from '@/features/withdrawals/server';

export async function PATCH(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { action, note } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const result = await adminUpdateWithdrawal(params.id, { action, note, adminId: 'admin' });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
