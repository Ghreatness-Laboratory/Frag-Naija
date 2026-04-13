import { NextResponse } from 'next/server';
import { getWagers, createWager } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET() {
  try {
    const data = await getWagers();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await createWager(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
