import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { ids } = await request.json();
    const featuredIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

    const { error: clearError } = await supabaseAdmin.from('wagers').update({ featured_on_home: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (clearError) throw clearError;

    if (featuredIds.length) {
      const { error: setError } = await supabaseAdmin.from('wagers').update({ featured_on_home: true }).in('id', featuredIds);
      if (setError) throw setError;
    }

    return NextResponse.json({ featuredCount: featuredIds.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
