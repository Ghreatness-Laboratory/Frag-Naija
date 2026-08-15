import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { settleDuelMatch } from '@/features/duels/server';
export const dynamic = 'force-dynamic';
export async function PATCH(request, { params }) { const authErr = await checkAdmin(); if (authErr) return authErr; try { const { winner_id } = await request.json(); if (!winner_id) return NextResponse.json({ error: 'winner_id is required' }, { status: 400 }); return NextResponse.json(await settleDuelMatch(params.id, winner_id)); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
