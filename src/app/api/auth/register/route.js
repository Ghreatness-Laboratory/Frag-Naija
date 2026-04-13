import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createWallet } from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username: username || email.split('@')[0] },
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create wallet for new user
    try {
      await createWallet(data.user.id);
    } catch {
      // Wallet creation is non-fatal; log silently
    }

    return NextResponse.json({
      id:       data.user.id,
      email:    data.user.email,
      username: data.user.user_metadata.username,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
