import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getCurrentUser } from '@/features/auth/server';
import { getNewsById, updateNews, deleteNews, toggleNewsLike, createNewsComment, recordAnonymousNewsView, toggleAnonymousNewsLike } from '@/features/news/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function getSessionId() {
  const cookieStore = cookies();
  let sessionId = cookieStore.get('fn_session_id')?.value;
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  return sessionId;
}

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
    const isAnonymous = !user;
    
    // Record view for both logged-in and anonymous users
    if (isAnonymous) {
      const sessionId = getSessionId();
      await recordAnonymousNewsView(params.id, sessionId);
    } else {
      // For logged-in users, use existing per-user tracking
      await getNewsById(params.id, { currentUserId: user.id, recordView: true });
    }
    
    const data = await getNewsById(params.id, { currentUserId: user?.id, recordView: false });
    if (!data.published) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    
    if (body.action === 'like') {
      const user = await getCurrentUser();
      if (user) {
        // Logged-in user: use per-user like tracking
        return NextResponse.json(await toggleNewsLike(params.id, user.id));
      } else {
        // Anonymous user: use session-based like tracking
        const sessionId = getSessionId();
        return NextResponse.json(await toggleAnonymousNewsLike(params.id, sessionId));
      }
    }
    
    if (body.action === 'comment') {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Login required to comment' }, { status: 401 });
      }
      return NextResponse.json(await createNewsComment(params.id, user.id, body.body), { status: 201 });
    }
    
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
