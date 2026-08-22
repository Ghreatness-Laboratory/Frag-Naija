import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/features/auth/server';
import { getAdminSessionCookieName, verifyAdminSessionToken } from '@/features/shared/server/adminSession';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user) return NextResponse.json(user);

    const adminToken = cookies().get(getAdminSessionCookieName())?.value;
    if (await verifyAdminSessionToken(adminToken)) {
      return NextResponse.json({ id: 'admin', username: 'Admin', role: 'admin', is_admin: true });
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
