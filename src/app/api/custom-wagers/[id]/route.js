import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { actOnCustomWager } from '@/features/custom-wagers';
export const dynamic = 'force-dynamic';
export async function POST(req,{params}){ try{ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); const body=await req.json(); return NextResponse.json(await actOnCustomWager(user.id, params.id, body.action, body)); }catch(e){ return NextResponse.json({error:e.message},{status:500}); } }
