import { NextResponse } from 'next/server';
import { getActiveWagers } from '@/lib/db';

export async function GET() {
  try {
    const data = await getActiveWagers();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
