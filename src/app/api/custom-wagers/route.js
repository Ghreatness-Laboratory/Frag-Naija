import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { createCustomWager, listCustomWagers } from '@/features/custom-wagers';
export const dynamic = 'force-dynamic';
export async function GET(){ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); return NextResponse.json(await listCustomWagers(user.id)); }
export async function POST(req){ try{ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); return NextResponse.json(await createCustomWager(user.id, await req.json()), {status:201}); }catch(e){ return NextResponse.json({error:e.message},{status:500}); } }
