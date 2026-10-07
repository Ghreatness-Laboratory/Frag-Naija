import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { listCustomWagers } from '@/features/custom-wagers';
export const dynamic='force-dynamic';
export async function GET(){ const err=await checkAdmin(); if(err) return err; return NextResponse.json(await listCustomWagers(null,{admin:true})); }
