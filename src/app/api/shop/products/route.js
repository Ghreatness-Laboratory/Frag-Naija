import { NextResponse } from 'next/server';
import { getShopProducts } from '@/features/shop-server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const data = await getShopProducts({ featured });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
