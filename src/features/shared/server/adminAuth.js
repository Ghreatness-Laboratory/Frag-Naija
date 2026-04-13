import { cookies } from 'next/headers';

import { unauthorized } from './api';
import { getAdminSessionCookieName, verifyAdminSessionToken } from './adminSession';

export async function checkAdmin() {
  try {
    const cookieStore = cookies();
    const adminAuth = cookieStore.get(getAdminSessionCookieName())?.value;

    if (!(await verifyAdminSessionToken(adminAuth))) {
      return unauthorized('Unauthorized - admin access required');
    }

    return null;
  } catch {
    return unauthorized('Failed to verify admin credentials');
  }
}
