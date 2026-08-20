import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getUserSettings, updateUserSettings } from '@/features/userProfile.server';
export const dynamic = 'force-dynamic';
export async function GET(){ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); return NextResponse.json(await getUserSettings(user.id)); }
export async function PUT(req){ try{ const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Login required'},{status:401}); return NextResponse.json(await updateUserSettings(user.id, await req.json())); }catch(e){ return NextResponse.json({error:e.message},{status:400}); } }
