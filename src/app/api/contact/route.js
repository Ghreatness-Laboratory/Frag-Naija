import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'name, email, and message are required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('contact_requests')
      .insert([{ name, email, message }]);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
