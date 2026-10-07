import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { createPartner, deletePartner, listPartners, updatePartner } from '@/features/partners.server';

export const dynamic = 'force-dynamic';

export async function GET(request) { const admin = new URL(request.url).searchParams.get('admin') === '1'; if (admin) { const authErr = await checkAdmin(); if (authErr) return authErr; } try { return NextResponse.json(await listPartners({ includeDrafts: admin })); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
export async function POST(request) { const authErr = await checkAdmin(); if (authErr) return authErr; try { return NextResponse.json(await createPartner(await request.json())); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
export async function PUT(request) { const authErr = await checkAdmin(); if (authErr) return authErr; try { const body = await request.json(); return NextResponse.json(await updatePartner(body.id, body)); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
export async function DELETE(request) { const authErr = await checkAdmin(); if (authErr) return authErr; try { return NextResponse.json(await deletePartner(new URL(request.url).searchParams.get('id'))); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
