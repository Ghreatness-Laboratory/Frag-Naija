import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { cancelWithdrawal } from '@/features/withdrawals/server';

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await cancelWithdrawal(user.id, params.id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
