import { NextResponse } from 'next/server';
import { getBanks } from '@/lib/paystack';

export async function GET() {
  try {
    const result = await getBanks();
    if (!result.status) {
      return NextResponse.json({ error: result.message || 'Failed to fetch banks' }, { status: 502 });
    }
    return NextResponse.json(result.data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
