import { NextResponse } from 'next/server';
import { createShopItem, getShopItems } from '@/features/shop/server';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getShopItems({ status: searchParams.get('all') === '1' ? '' : (searchParams.get('status') || 'Published'), game_slug: searchParams.get('game_slug') || '' });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    const data = await createShopItem(await request.json());
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
