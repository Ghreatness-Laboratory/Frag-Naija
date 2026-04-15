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

    if (!bank_name || !bank_code || !account_number || !account_name) {
      return NextResponse.json(
        { error: 'bank_name, bank_code, account_number, and account_name are required' },
        { status: 400 }
      );
    }

    const saved = await saveUserBankAccount(user.id, {
      bank_name,
      bank_code,
      account_number,
      account_name,
      paystack_recipient_code,
    });

    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
