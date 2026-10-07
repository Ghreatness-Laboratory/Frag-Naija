import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getOffers } from '@/features/offers.server';
export const dynamic = 'force-dynamic';
export async function GET(){ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); return NextResponse.json(await getOffers(user.id)); }
