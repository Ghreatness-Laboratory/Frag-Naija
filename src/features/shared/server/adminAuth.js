import { cookies } from 'next/headers';

import { unauthorized } from './api';

export function checkAdmin() {
  try {
    const cookieStore = cookies();
    const adminAuth = cookieStore.get('admin_auth')?.value;

    if (!adminAuth || adminAuth !== process.env.ADMIN_PASSWORD) {
      return unauthorized('Unauthorized - admin access required');
    }

    return null;
  } catch {
    return unauthorized('Failed to verify admin credentials');
  }
}
