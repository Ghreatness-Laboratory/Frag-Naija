import { NextResponse } from 'next/server';

export function json(data, init) {
  return NextResponse.json(data, init);
}

export function created(data) {
  return json(data, { status: 201 });
}

export function badRequest(error) {
  return json({ error }, { status: 400 });
}

export function unauthorized(error = 'Unauthorized') {
  return json({ error }, { status: 401 });
}

export function notFound(error = 'Not found') {
  return json({ error }, { status: 404 });
}

export function serverError(error) {
  return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
}
