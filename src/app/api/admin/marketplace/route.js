import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { getMarketplaceReviewQueue } from '@/features/marketplace/server';
export const dynamic = 'force-dynamic';
export async function GET() { const err = await checkAdmin(); if (err) return err; try { return NextResponse.json(await getMarketplaceReviewQueue()); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
