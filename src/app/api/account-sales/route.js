import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { listAccountSales, submitAccountSale } from '@/features/account-sales/server';
export const dynamic = 'force-dynamic';
export async function GET(request) { try { const p=new URL(request.url).searchParams; const number=(key)=>p.get(key)===null?undefined:Number(p.get(key)); return NextResponse.json(await listAccountSales({game_slug:p.get('game_slug')||'',min_price:number('min_price'),max_price:number('max_price')})); } catch(e) { return NextResponse.json({error:e.message},{status:500}); } }
export async function POST(request) { const user=await getCurrentUser(); if(!user) return NextResponse.json({error:'Sign in to submit an account sale listing.'},{status:401}); try { return NextResponse.json(await submitAccountSale(user.id,await request.json()),{status:201}); } catch(e) { return NextResponse.json({error:e.message},{status:400}); } }
