import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.paystack.co/bank?country=nigeria&currency=NGN&perPage=200',
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const json = await res.json();

    if (!res.ok || !json.status) {
      return NextResponse.json({ error: json.message || 'Failed to fetch banks' }, { status: 500 });
    }

    return NextResponse.json(json.data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
