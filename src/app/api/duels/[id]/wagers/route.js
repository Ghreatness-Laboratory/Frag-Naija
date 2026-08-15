import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { placeDuelWager } from '@/features/duels/server';
export const dynamic = 'force-dynamic';
export async function POST(request, { params }) { try { const user = await getCurrentUser(); if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 }); const body = await request.json(); const wager = await placeDuelWager({ duel_id: params.id, user_id: user.id, picked_player_id: body.picked_player_id, stake: body.stake }); return NextResponse.json(wager, { status: 201 }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
