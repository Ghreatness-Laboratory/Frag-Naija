import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { calculateUniqueFantasyPrices } from '@/lib/fantasy-pricing';

export const dynamic = 'force-dynamic';

export async function POST() {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  const { data: athletes, error } = await supabaseAdmin.from('athletes').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const prices = calculateUniqueFantasyPrices(athletes || []);
  const updates = Array.from(prices.entries()).map(([id, fantasy_price]) => ({ id, fantasy_price }));

  for (const update of updates) {
    const { error: updateError } = await supabaseAdmin.from('athletes').update({ fantasy_price: update.fantasy_price }).eq('id', update.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ updated: updates.length, duplicate_prices: 0 });
}
