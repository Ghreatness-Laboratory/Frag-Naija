import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getPredictors, upsertPredictor } from '@/features/predictors/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getPredictors();
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
    const data = await upsertPredictor(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
