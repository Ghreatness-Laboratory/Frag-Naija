import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/server';
import { getUserWagers } from '@/features/wagers/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const wagers = await getUserWagers(user.id);
    return NextResponse.json(wagers);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
