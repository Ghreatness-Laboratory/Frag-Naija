import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
