import { NextResponse } from 'next/server';
import { initializeTransaction, generateReference } from '@/lib/paystack';
import { getWagerForPlacement } from '@/features/wagers/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { wager_id, selection, amount, email } = await request.json();

    if (!wager_id || !selection || !amount || !email) {
      return NextResponse.json(
        { error: 'wager_id, selection, amount, and email are required' },
        { status: 400 }
      );
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'PAYSTACK_SECRET_KEY is not configured' }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL is not configured' }, { status: 500 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: 'Minimum wager amount is ₦100' }, { status: 400 });
    }

    // Fetch wager to get odds and verify it's active
    let wager;
    try {
      wager = await getWagerForPlacement(wager_id);
    } catch {
      return NextResponse.json({ error: 'Wager not found' }, { status: 404 });
    }

    if (wager.status !== 'Active') {
      return NextResponse.json({ error: 'This wager is no longer active' }, { status: 400 });
    }

    if (new Date(wager.closes_at) < new Date()) {
      return NextResponse.json({ error: 'This wager has closed' }, { status: 400 });
    }

    const isPlayerPick = wager.type === 'player_pick';

    // Validate selection
    if (isPlayerPick) {
      const validOptions = Array.isArray(wager.options)
        ? wager.options.map((o) => o.label)
        : [];
      if (!validOptions.includes(selection)) {
        return NextResponse.json({ error: 'Invalid player selection' }, { status: 400 });
      }
    } else if (!['YES', 'NO'].includes(selection)) {
      return NextResponse.json({ error: 'selection must be YES or NO' }, { status: 400 });
    }

    // Calculate odds
    let odds;
    if (isPlayerPick) {
      const option = wager.options.find((o) => o.label === selection);
      odds = option?.odds ?? 1;
    } else {
      odds = selection === 'YES' ? wager.yes_odds : wager.no_odds;
    }

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
      return NextResponse.json(
        { error: `Paystack: ${result.message || 'Payment initialization failed'}` },
        { status: 502 }
      );
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
