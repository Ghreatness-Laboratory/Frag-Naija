import { NextResponse } from 'next/server';
import { getShopItems } from '@/features/shop/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getShopItems({ status: searchParams.get('status') || 'Published', game_slug: searchParams.get('game_slug') || '' });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
