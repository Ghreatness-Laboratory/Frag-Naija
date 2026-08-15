import { NextResponse } from 'next/server';
import { createDuelMatch } from '@/features/duels/server';
export const dynamic = 'force-dynamic';
export async function POST(request) { try { return NextResponse.json(await createDuelMatch(await request.json()), { status: 201 }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
