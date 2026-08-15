import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getCompanyProfile, updateCompanyProfile } from '@/features/companyProfile.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getCompanyProfile(), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    return NextResponse.json(await updateCompanyProfile(await request.json()));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
