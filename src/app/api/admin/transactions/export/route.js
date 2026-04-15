import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getAllTransactions } from '@/features/deposits/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { data } = await getAllTransactions({ limit: 10000 });

    const header  = ['ID', 'User ID', 'Reference', 'Type', 'Amount Paid (₦)', 'Fee (₦)', 'Credited (₦)', 'Status', 'Note', 'Date'];
    const rows    = data.map((t) => [
      t.id,
      t.user_id ?? '',
      t.reference,
      t.type,
      t.amount_paid,
      t.fee,
      t.amount_credited,
      t.status,
      (t.note ?? '').replace(/,/g, ';'),
      new Date(t.created_at).toISOString(),
    ]);

    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': `attachment; filename="transactions_${Date.now()}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
