import { NextResponse } from 'next/server';
import { toggleWagerHot } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function PATCH(request, { params }) {
  const authErr = checkAdmin();
  if (authErr) return authErr;

  try {
    const data = await toggleWagerHot(params.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
