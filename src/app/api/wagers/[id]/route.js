import { NextResponse } from 'next/server';
import { getWagerById, deleteWager } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request, { params }) {
  try {
    const data = await getWagerById(params.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const authErr = checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('wagers').update(body).eq('id', params.id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    await deleteWager(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
