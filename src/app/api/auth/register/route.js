import { NextResponse } from 'next/server';
import { registerUser } from '@/features/auth/server';

export async function POST(request) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const user = await registerUser({ email, password, username });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
