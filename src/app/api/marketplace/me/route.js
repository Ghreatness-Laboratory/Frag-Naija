import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getMyMarketplaceListing, submitMarketplaceListing } from '@/features/marketplace/server';
export const dynamic = 'force-dynamic';
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 }); try { return NextResponse.json(await getMyMarketplaceListing(user.id)); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
export async function PUT(request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 }); try { return NextResponse.json(await submitMarketplaceListing(user.id, await request.json())); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
