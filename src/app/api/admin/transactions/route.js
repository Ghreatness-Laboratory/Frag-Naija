import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getAllTransactions } from '@/features/deposits/server';

export async function GET(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const page  = Number(searchParams.get('page')  || 1);
    const limit = Number(searchParams.get('limit') || 100);

    const result = await getAllTransactions({ page, limit });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
