import { NextResponse } from 'next/server';
import { getActiveWagers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getActiveWagers({ game_slug: searchParams.get('game_slug') || '' });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
