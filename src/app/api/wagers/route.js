import { NextResponse } from 'next/server';
import { getWagers, createWager } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game_slug = searchParams.get('game') || searchParams.get('game_slug') || '';
    const data = await getWagers({ game_slug });
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('Failed to fetch wagers:', e);
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await createWager(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create wager';
    const isValidationError = [
      'Question, match / game fixture, and closing time are required.',
      'Choose a valid wager type.',
      'Pick wagers need at least two named options with odds greater than 1.',
    ].includes(message);
    return NextResponse.json({ error: message }, { status: isValidationError ? 400 : 500 });
  }
}
