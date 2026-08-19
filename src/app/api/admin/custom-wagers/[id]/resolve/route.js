import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { adminResolveCustomWager } from '@/features/custom-wagers';
export const dynamic='force-dynamic';
export async function POST(req,{params}){ const err=await checkAdmin(); if(err) return err; try{ return NextResponse.json(await adminResolveCustomWager(null, params.id, await req.json())); }catch(e){ return NextResponse.json({error:e.message},{status:500}); } }
