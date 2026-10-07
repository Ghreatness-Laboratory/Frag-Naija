import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
export const dynamic='force-dynamic';
export async function PUT(req,{params}){ const authErr=await checkAdmin(); if(authErr) return authErr; try{ const body=await req.json(); const payload={code:String(body.code||'').trim().toUpperCase(),value_ngn:Number(body.value_ngn),expires_at:body.expires_at||null,usage_limit:body.usage_limit?Number(body.usage_limit):null,per_user_limit:Number(body.per_user_limit||1),is_active:body.is_active!==false,updated_at:new Date().toISOString()}; const {data,error}=await supabaseAdmin.from('promo_codes').update(payload).eq('id',params.id).select().single(); if(error) throw error; return NextResponse.json(data); }catch(e){ return NextResponse.json({error:e.message},{status:400}); } }
export async function DELETE(_req,{params}){ const authErr=await checkAdmin(); if(authErr) return authErr; const {error}=await supabaseAdmin.from('promo_codes').delete().eq('id',params.id); if(error) return NextResponse.json({error:error.message},{status:500}); return NextResponse.json({deleted:true}); }
