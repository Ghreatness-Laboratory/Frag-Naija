import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { searchUsersByUsername } from '@/features/custom-wagers';
export const dynamic='force-dynamic';
export async function GET(req){ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); const {searchParams}=new URL(req.url); return NextResponse.json(await searchUsersByUsername(searchParams.get('q'), user.id)); }
