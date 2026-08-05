import { NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://frag-naija-backend.onrender.com';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game_slug = searchParams.get('game_slug') || '';
    
    const params = new URLSearchParams();
    if (game_slug) params.append('game_slug', game_slug);
    
    const djangoUrl = `${DJANGO_API_URL}/api/teams/?${params.toString()}`;
    
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
    console.error('Teams API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
