import { NextResponse } from 'next/server';
import { initializeTransaction, generateReference } from '@/lib/paystack';
import { getWagerForPlacement, getUserIdByEmail, createWagerBet } from '@/features/wagers/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { MAX_WAGER_AMOUNT, MIN_WAGER_AMOUNT } from '@/features/wagers/constants';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { wager_id, selection, amount, email } = body;
    const requestedSelections = Array.isArray(body.selections)
      ? body.selections
      : wager_id && selection
        ? [{ wager_id, selection }]
        : [];

    if (!requestedSelections.length || !amount || !email) {
      return NextResponse.json(
        { error: 'selection(s), amount, and email are required' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Enter a valid wager amount' }, { status: 400 });
    }

    if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
      return NextResponse.json({ error: 'Wager amount may include at most 2 decimal places' }, { status: 400 });
    }

    if (numericAmount < MIN_WAGER_AMOUNT) {
      return NextResponse.json({ error: `Minimum wager amount is ₦${MIN_WAGER_AMOUNT.toLocaleString('en-NG')}` }, { status: 400 });
    }

    if (numericAmount > MAX_WAGER_AMOUNT) {
      return NextResponse.json({ error: `Maximum wager amount is ₦${MAX_WAGER_AMOUNT.toLocaleString('en-NG')}` }, { status: 400 });
    }

    const seenWagers = new Set();
    let combinedOdds = 1;
    const resolvedSelections = [];

    for (const requested of requestedSelections) {
      if (!requested.wager_id || !requested.selection) {
        return NextResponse.json({ error: 'Each selection requires wager_id and selection' }, { status: 400 });
      }

      const wagerKey = String(requested.wager_id);
      if (seenWagers.has(wagerKey)) {
        return NextResponse.json({ error: 'Duplicate/conflicting selections from the same wager are not allowed' }, { status: 400 });
      }
      seenWagers.add(wagerKey);

      let wager;
      try {
        wager = await getWagerForPlacement(requested.wager_id);
      } catch {
        return NextResponse.json({ error: 'Wager not found' }, { status: 404 });
      }

      if (wager.status !== 'Active') {
        return NextResponse.json({ error: 'One or more wagers are no longer active' }, { status: 400 });
      }

      if (new Date(wager.closes_at) < new Date()) {
        return NextResponse.json({ error: 'One or more wagers have closed' }, { status: 400 });
      }

      const options = Array.isArray(wager.options) ? wager.options : [];
      const hasOptions = options.length > 0;
      let odds;

      if (hasOptions) {
        const option = options.find((o) => o.label === requested.selection);
        if (!option) {
          return NextResponse.json({ error: 'Invalid wager option selection' }, { status: 400 });
        }
        odds = Number(option.odds ?? 1);
      } else if (['YES', 'NO'].includes(requested.selection)) {
        odds = requested.selection === 'YES' ? wager.yes_odds : wager.no_odds;
      } else {
        return NextResponse.json({ error: 'selection must be YES or NO' }, { status: 400 });
      }

      combinedOdds *= Number(odds);
      resolvedSelections.push({ wager_id: requested.wager_id, selection: requested.selection, odds: Number(odds) });
    }

    const potential = numericAmount * Number(combinedOdds);
    const primarySelection = resolvedSelections[0];

    // ── Try wallet-balance payment first ────────────────────────────────────
    const user_id = await getUserIdByEmail(email);
    if (user_id) {
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', user_id)
        .single();

      if (wallet && Number(wallet.balance) >= Number(amount)) {
        // Deduct from wallet
        await supabaseAdmin
          .from('wallets')
          .update({
            balance:    Number(wallet.balance) - numericAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user_id);

        const reference = generateReference(resolvedSelections.length > 1 ? 'FNA' : 'FNW');
        for (let index = 0; index < resolvedSelections.length; index += 1) {
          const item = resolvedSelections[index];
          await createWagerBet({
            wager_id: item.wager_id,
            user_id,
            email,
            selection: item.selection,
            amount: index === 0 ? numericAmount : 0,
            potential: index === 0 ? potential : 0,
            reference: index === 0 ? reference : `${reference}-${index + 1}`,
          });
        }

        return NextResponse.json({ paid_from_wallet: true, potential, reference, combined_odds: combinedOdds });
      }
    }

    // ── Fall back to Paystack checkout ──────────────────────────────────────
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'PAYSTACK_SECRET_KEY is not configured' }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL is not configured' }, { status: 500 });
    }

    const reference = generateReference('FN');

    const result = await initializeTransaction({
      email,
      amount: numericAmount,
      reference,
      metadata: {
        wager_id: primarySelection.wager_id,
        selection: primarySelection.selection,
        selections: resolvedSelections,
        combined_odds: combinedOdds.toFixed(4),
        potential: potential.toFixed(2),
        custom_fields: [
          { display_name: 'Selections', variable_name: 'selections', value: String(resolvedSelections.length) },
          { display_name: 'Combined Odds', variable_name: 'combined_odds', value: combinedOdds.toFixed(2) },
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
      combined_odds: combinedOdds,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
