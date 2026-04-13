import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Checks for valid admin_auth cookie.
 * Returns null if authorized, or a NextResponse 401 if not.
 * Call at the top of every admin-only route handler.
 *
 * Usage:
 *   const authErr = checkAdmin();
 *   if (authErr) return authErr;
 */
export function checkAdmin() {
  try {
    const cookieStore = cookies();
    const adminAuth = cookieStore.get('admin_auth')?.value;

    if (!adminAuth || adminAuth !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized — admin access required' },
        { status: 401 }
      );
    }
    return null; // authorized
  } catch {
    return NextResponse.json(
      { error: 'Failed to verify admin credentials' },
      { status: 401 }
    );
  }
}
