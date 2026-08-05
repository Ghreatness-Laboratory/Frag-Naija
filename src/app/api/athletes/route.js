import { NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://frag-naija-backend.onrender.com';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game_slug = searchParams.get('game_slug') || '';
    const is_icon = searchParams.get('is_icon');
    
    // Build query params for Django
    const params = new URLSearchParams();
    if (game_slug) params.append('game_slug', game_slug);
    if (is_icon !== null) params.append('is_icon', is_icon);
    
    const djangoUrl = `${DJANGO_API_URL}/api/athletes/?${params.toString()}`;
    
    const response = await fetch(djangoUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Django API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data.results || data);
  } catch (error) {
    console.error('Athletes API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
