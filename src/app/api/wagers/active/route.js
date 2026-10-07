import { NextResponse } from 'next/server';
import { getActiveWagers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game_slug = searchParams.get('game') || searchParams.get('game_slug') || '';
    const data = await getActiveWagers({ game_slug });
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('Failed to fetch active wagers:', e);
    return NextResponse.json([]);
  }
}
