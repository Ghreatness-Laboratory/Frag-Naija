import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getWallet } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    let wallet = null;
    try {
      wallet = await getWallet(user.id);
    } catch {
      // Wallet may not exist yet
    }

    return NextResponse.json({
      id:       user.id,
      email:    user.email,
      username: user.user_metadata?.username,
      wallet,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
