import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getHomepageSettings, updateHomepageSettings } from '@/features/homepage/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getHomepageSettings(), {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  
  try {
    const body = await request.json();
    await updateHomepageSettings(body);
    return NextResponse.json({ 
      ok: true, 
      message: 'Homepage settings saved successfully' 
    });
  } catch (e) {
    console.error('Failed to save homepage settings:', e);
    return NextResponse.json({ 
      error: e.message || 'Failed to save settings' 
    }, { status: 500 });
  }
}
