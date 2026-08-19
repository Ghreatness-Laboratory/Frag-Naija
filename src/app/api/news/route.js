import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getCurrentUser } from '@/features/auth/server';
import { getAllNews, createNews } from '@/features/news/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('all') === '1';
    if (adminView) {
      const authErr = await checkAdmin();
      if (authErr) return authErr;
      return NextResponse.json(await getAllNews({ includeContent: true }));
    }

    const user = await getCurrentUser();
    const data = await getAllNews({ published: true, includeContent: false, currentUserId: user?.id ?? null });
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
    const data = await createNews(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
