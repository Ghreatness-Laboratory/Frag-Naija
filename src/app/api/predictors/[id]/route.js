import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getPredictorById, upsertPredictor, deletePredictor } from '@/features/predictors/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const data = await getPredictorById(params.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await upsertPredictor({ ...body, id: params.id });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    await deletePredictor(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
