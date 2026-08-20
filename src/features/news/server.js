import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const ARTICLE_SELECT = 'id,title,content,excerpt,image_url,author,published,published_at,pinned,like_count_offset,view_count_offset,created_at,updated_at';

function cleanText(value) {
  return String(value ?? '').trim();
}

const PLACEHOLDER_NEWS_PATTERNS = [
  /blaze['’]?s legacy/i,
  /ethan\s+["'“”‘’]?blaze/i,
  /cyber strike/i,
];

function truncateAtWord(value, maxLength) {
  const text = cleanText(value).replace(/\s+/g, ' ');
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength + 1);
  const boundary = clipped.search(/\s+\S*$/);
  const safe = boundary > 40 ? clipped.slice(0, boundary) : clipped.slice(0, maxLength);
  return `${safe.replace(/[\s.,;:!?-]+$/, '')}…`;
}

function makeExcerpt(content, explicitExcerpt = '') {
  const excerpt = cleanText(explicitExcerpt);
  if (excerpt) return truncateAtWord(excerpt, 170);
  return truncateAtWord(content, 155);
}

function isPlaceholderNews(row) {
  const haystack = `${row?.title ?? ''} ${row?.excerpt ?? ''} ${row?.content ?? ''}`;
  return PLACEHOLDER_NEWS_PATTERNS.some((pattern) => pattern.test(haystack));
}

function normalizeArticle(row, counts = {}, currentUserId = null) {
  const organicLikes = Number(counts.likes ?? row.organic_likes ?? 0);
  const organicViews = Number(counts.views ?? row.organic_views ?? 0);
  const commentCount = Number(counts.comments ?? row.comment_count ?? 0);
  return {
    ...row,
    excerpt: makeExcerpt(row.content, row.excerpt),
    organic_likes: organicLikes,
    organic_views: organicViews,
    like_count: Math.max(0, organicLikes + Number(row.like_count_offset ?? 0)),
    view_count: Math.max(0, organicViews + Number(row.view_count_offset ?? 0)),
    comment_count: commentCount,
    liked_by_me: currentUserId ? Boolean(counts.likedByMe) : false,
  };
}

async function getCounts(articleIds, currentUserId = null) {
  const ids = articleIds.filter(Boolean);
  if (!ids.length) return new Map();

  const [likesRes, viewsRes, commentsRes, myLikesRes] = await Promise.all([
    supabaseAdmin.from('news_likes').select('article_id', { count: 'exact', head: false }).in('article_id', ids),
    supabaseAdmin.from('news_views').select('article_id', { count: 'exact', head: false }).in('article_id', ids),
    supabaseAdmin.from('news_comments').select('article_id', { count: 'exact', head: false }).in('article_id', ids),
    currentUserId
      ? supabaseAdmin.from('news_likes').select('article_id').eq('user_id', currentUserId).in('article_id', ids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const res of [likesRes, viewsRes, commentsRes, myLikesRes]) {
    if (res.error) throw res.error;
  }

  const map = new Map(ids.map((id) => [id, { likes: 0, views: 0, comments: 0, likedByMe: false }]));
  for (const row of likesRes.data ?? []) map.get(row.article_id).likes += 1;
  for (const row of viewsRes.data ?? []) map.get(row.article_id).views += 1;
  for (const row of commentsRes.data ?? []) map.get(row.article_id).comments += 1;
  for (const row of myLikesRes.data ?? []) map.get(row.article_id).likedByMe = true;
  return map;
}

export async function getAllNews({ published, includeContent = false, currentUserId = null } = {}) {
  let query = supabaseAdmin
    .from('news')
    .select(ARTICLE_SELECT)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (published === true) query = query.eq('published', true);

  const { data, error } = await query;
  if (error) throw error;

  const rows = published === true ? (data || []).filter((row) => !isPlaceholderNews(row)) : (data || []);
  const counts = await getCounts(rows.map((row) => row.id), currentUserId);
  return rows.map((row) => {
    const article = normalizeArticle(row, counts.get(row.id), currentUserId);
    return includeContent ? article : { ...article, content: undefined };
  });
}

export async function recordNewsView(articleId, userId) {
  const { error } = await supabaseAdmin
    .from('news_views')
    .upsert(
      { article_id: articleId, user_id: userId, last_viewed_at: new Date().toISOString() },
      { onConflict: 'article_id,user_id', ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function getNewsById(id, { currentUserId = null, recordView = false, admin = false } = {}) {
  const { data, error } = await supabaseAdmin
    .from('news')
    .select(ARTICLE_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!admin && !data.published) throw new Error('Article not found');
  if (!admin && isPlaceholderNews(data)) throw new Error('Article not found');

  if (recordView && currentUserId && data.published) {
    await recordNewsView(id, currentUserId);
  }

  const counts = await getCounts([id], currentUserId);
  const comments = await getNewsComments(id);
  return { ...normalizeArticle(data, counts.get(id), currentUserId), comments };
}

export async function createNews(body) {
  const title = cleanText(body.title);
  const content = cleanText(body.content);
  if (!title || !content) throw new Error('Title and content are required');

  const article = {
    title,
    content,
    excerpt: makeExcerpt(content, body.excerpt),
    image_url: cleanText(body.image_url) || null,
    author: cleanText(body.author) || null,
    published: Boolean(body.published),
    published_at: body.published_at || (body.published ? new Date().toISOString() : null),
    pinned: Boolean(body.pinned),
    like_count_offset: Math.max(0, Number(body.like_count ?? 0)),
    view_count_offset: Math.max(0, Number(body.view_count ?? 0)),
  };

  const { data, error } = await supabaseAdmin.from('news').insert([article]).select(ARTICLE_SELECT).single();
  if (error) throw error;
  return normalizeArticle(data, { likes: 0, views: 0, comments: 0 });
}

export async function updateNews(id, body) {
  const current = await getNewsById(id, { admin: true });
  const updates = {};

  if (body.title !== undefined) updates.title = cleanText(body.title);
  if (body.content !== undefined) updates.content = cleanText(body.content);
  if (body.excerpt !== undefined || body.content !== undefined) updates.excerpt = makeExcerpt(updates.content ?? current.content, body.excerpt ?? current.excerpt);
  if (body.image_url !== undefined) updates.image_url = cleanText(body.image_url) || null;
  if (body.author !== undefined) updates.author = cleanText(body.author) || null;
  if (body.published !== undefined) updates.published = Boolean(body.published);
  if (body.published_at !== undefined) updates.published_at = body.published_at || null;
  if (body.pinned !== undefined) updates.pinned = Boolean(body.pinned);

  if (body.like_count !== undefined) {
    updates.like_count_offset = Math.max(0, Number(body.like_count)) - Number(current.organic_likes ?? 0);
  }
  if (body.view_count !== undefined) {
    updates.view_count_offset = Math.max(0, Number(body.view_count)) - Number(current.organic_views ?? 0);
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin.from('news').update(updates).eq('id', id).select(ARTICLE_SELECT).single();
  if (error) throw error;

  const counts = await getCounts([id]);
  return normalizeArticle(data, counts.get(id));
}

export async function deleteNews(id) {
  const { error } = await supabaseAdmin.from('news').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleNewsLike(articleId, userId) {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('news_likes')
    .select('article_id')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    const { error } = await supabaseAdmin.from('news_likes').delete().eq('article_id', articleId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from('news_likes').insert([{ article_id: articleId, user_id: userId }]);
    if (error) throw error;
  }

  return getNewsById(articleId, { currentUserId: userId });
}

export async function getNewsComments(articleId) {
  const { data, error } = await supabaseAdmin
    .from('news_comments')
    .select('id,article_id,user_id,body,created_at,updated_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function createNewsComment(articleId, userId, body) {
  const text = cleanText(body);
  if (!text) throw new Error('Comment cannot be empty');
  const { data, error } = await supabaseAdmin
    .from('news_comments')
    .insert([{ article_id: articleId, user_id: userId, body: text }])
    .select('id,article_id,user_id,body,created_at,updated_at')
    .single();
  if (error) throw error;
  return data;
}
