import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getCurrentUser } from '@/features/auth/server';
import { getNewsById, updateNews, deleteNews, toggleNewsLike, createNewsComment } from '@/features/news/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const adminPreview = searchParams.get('admin') === '1';
    if (adminPreview) {
      const authErr = await checkAdmin();
      if (authErr) return authErr;
      return NextResponse.json(await getNewsById(params.id, { admin: true }));
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required to read full articles' }, { status: 401 });
    const data = await getNewsById(params.id, { currentUserId: user.id, recordView: true });
    if (!data.published) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const body = await request.json();
    if (body.action === 'like') return NextResponse.json(await toggleNewsLike(params.id, user.id));
    if (body.action === 'comment') return NextResponse.json(await createNewsComment(params.id, user.id, body.body), { status: 201 });
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await updateNews(params.id, body);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    await deleteNews(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
