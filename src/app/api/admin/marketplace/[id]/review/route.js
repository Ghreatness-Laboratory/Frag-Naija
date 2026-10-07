import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { reviewMarketplaceListing } from '@/features/marketplace/server';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) { const err = await checkAdmin(); if (err) return err; try { return NextResponse.json(await reviewMarketplaceListing(params.id, await request.json())); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
