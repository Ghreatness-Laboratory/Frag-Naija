import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { toggleWagerFeaturedOnHome } from '@/features/wagers/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const data = await toggleWagerFeaturedOnHome(id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
