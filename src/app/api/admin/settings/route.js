import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getSettings, updateSetting } from '@/features/settings/server';

export async function GET() {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    // body is { key: value, key2: value2, ... }
    await Promise.all(Object.entries(body).map(([k, v]) => updateSetting(k, v)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
