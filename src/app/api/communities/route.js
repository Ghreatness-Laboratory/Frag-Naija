import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { createCommunity, getCommunities } from '@/features/communities/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === '1';
    const data = await getCommunities({
      game_slug: searchParams.get('game_slug') || '',
      tier: searchParams.get('tier') || '',
      status: all ? '' : (searchParams.get('status') || 'Published'),
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    const data = await createCommunity(await request.json());
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
