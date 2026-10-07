import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getOpenDuelMatches } from '@/features/duels/server';
export const dynamic = 'force-dynamic';
export async function GET() { const authErr = await checkAdmin(); if (authErr) return authErr; try { return NextResponse.json(await getOpenDuelMatches()); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
