import { NextResponse } from 'next/server';
import { getActiveWagers } from '@/lib/db';
import { requireGameSlug } from '@/lib/game-scope';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = requireGameSlug(searchParams);
    const data = await getActiveWagers({ gameSlug });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
