import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { redeemPromoCode } from '@/features/offers.server';
export const dynamic = 'force-dynamic';
export async function POST(req){ try{ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); const body=await req.json(); return NextResponse.json(await redeemPromoCode(user.id, body.code)); }catch(e){ return NextResponse.json({error:e.message},{status:400}); } }
