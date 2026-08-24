import { NextResponse } from 'next/server';
import { lookupBetSlip } from '@/features/wagers/server';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const code = new URL(request.url).searchParams.get('code');
    return NextResponse.json(await lookupBetSlip(code));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
