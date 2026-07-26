import { NextResponse } from 'next/server';
import { getShopItems } from '@/features/shop/server';
import { requireGameSlug } from '@/lib/game-scope';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = requireGameSlug(searchParams);
    const data = await getShopItems({ status: searchParams.get('status') || 'Published', gameSlug });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
