import { NextResponse } from 'next/server';
import { initializeTransaction, generateReference } from '@/lib/paystack';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { wager_id, selection, amount, email } = await request.json();

    if (!wager_id || !selection || !amount || !email) {
      return NextResponse.json(
        { error: 'wager_id, selection, amount, and email are required' },
        { status: 400 }
      );
    }

    if (!['YES', 'NO'].includes(selection)) {
      return NextResponse.json({ error: 'selection must be YES or NO' }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: 'Minimum wager amount is ₦100' }, { status: 400 });
    }

    // Fetch wager to get odds and verify it's active
    const { data: wager, error: we } = await supabaseAdmin
      .from('wagers')
      .select('id, status, closes_at, yes_odds, no_odds')
      .eq('id', wager_id)
      .single();

    if (we || !wager) {
      return NextResponse.json({ error: 'Wager not found' }, { status: 404 });
    }

    if (wager.status !== 'Active') {
      return NextResponse.json({ error: 'This wager is no longer active' }, { status: 400 });
    }

    if (new Date(wager.closes_at) < new Date()) {
      return NextResponse.json({ error: 'This wager has closed' }, { status: 400 });
    }

    const odds = selection === 'YES' ? wager.yes_odds : wager.no_odds;
    const potential = Number(amount) * Number(odds);
    const reference = generateReference('FN');

    const result = await initializeTransaction({
      email,
      amount,
      reference,
      metadata: {
        wager_id,
        selection,
        potential: potential.toFixed(2),
        custom_fields: [
          { display_name: 'Wager ID',   variable_name: 'wager_id',  value: wager_id },
          { display_name: 'Selection',  variable_name: 'selection', value: selection },
        ],
      },
    });

    if (!result.status) {
      return NextResponse.json({ error: result.message || 'Payment initialization failed' }, { status: 502 });
    }

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference:         result.data.reference,
      potential,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
