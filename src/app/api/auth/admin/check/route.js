import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET() {
  const authErr = await checkAdmin();
  return NextResponse.json({ isAdmin: authErr === null });
}
