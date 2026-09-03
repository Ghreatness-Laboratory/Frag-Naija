import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getUserBankAccount, saveUserBankAccount } from '@/features/withdrawals/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const account = await getUserBankAccount(user.id);
    return NextResponse.json(account);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { bank_name, bank_code, account_number, account_name, paystack_recipient_code } =
      await request.json();

    const normalizedAccountNumber = String(account_number || '').replace(/\D/g, '');
    if (!bank_name || !bank_code || normalizedAccountNumber.length !== 10 || !account_name) {
      return NextResponse.json(
        { error: 'bank_name, bank_code, account_number, and account_name are required' },
        { status: 400 }
      );
    }

    const resolution = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(normalizedAccountNumber)}&bank_code=${encodeURIComponent(bank_code)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const resolutionJson = await resolution.json();
    const resolvedName = resolutionJson?.data?.account_name;
    if (!resolution.ok || !resolvedName) {
      return NextResponse.json({ error: resolutionJson?.message || 'Could not verify this bank account' }, { status: 400 });
    }

    const normalizeName = (name) => String(name || '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
    const resolvedParts = normalizeName(resolvedName);
    const firstName = normalizeName(user.first_name)[0];
    const lastName = normalizeName(user.last_name)[0];
    const namesMatch = Boolean(firstName && lastName && resolvedParts.some((part) => part === firstName) && resolvedParts.some((part) => part === lastName));
    if (!namesMatch) {
      return NextResponse.json({ error: "This account name doesn't match your registered name — payout accounts must belong to you." }, { status: 400 });
    }

    const saved = await saveUserBankAccount(user.id, {
      bank_name,
      bank_code,
      account_number: normalizedAccountNumber,
      account_name: resolvedName,
      paystack_recipient_code,
      verified_at: new Date().toISOString(),
    });

    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
