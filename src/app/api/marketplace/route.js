import { NextResponse } from 'next/server';
import { getPublicMarketplaceListings } from '@/features/marketplace/server';
export const dynamic = 'force-dynamic';
export async function GET(request) { try { const p = new URL(request.url).searchParams; const bool = (v) => v === null || v === '' ? undefined : v === 'true'; return NextResponse.json(await getPublicMarketplaceListings({ game_slug: p.get('game_slug') || '', free_agent: bool(p.get('free_agent')), loan_available: bool(p.get('loan_available')) })); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
