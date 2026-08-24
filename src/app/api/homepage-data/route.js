import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { DEFAULT_HOMEPAGE_SETTINGS, getHomepageSettings } from '@/features/homepage/server';
import { getCompanyProfile } from '@/features/companyProfile.server';
import { getFeaturedAthletes } from '@/features/featuredAthletes.server';
import { listStakeholders } from '@/features/stakeholders.server';

// Featured content is changed from the admin without a deployment.  This route
// must therefore always read through to Supabase instead of participating in
// Next's route cache or a CDN ISR window.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TEAM_FIELDS = 'id,name,logo_url,region,rank,wins,losses,kills,strength,game_slug';
const TOURNAMENT_FIELDS = 'id,name,start_date,end_date,status,game,prize_pool,currency';
const WAGER_FIELDS = 'id,question,subtitle,match_name,game_slug,yes_odds,no_odds,yes_price,no_price,pool_total,hot,status,closes_at,featured_on_home,type,options';
const TRANSFER_FIELDS = 'id,from_team,to_team,fee,status,date,athletes(id,name,ign)';
const SHOP_FIELDS = 'id,name,price,currency,image_url,category,status,tutorial_video_url';

function parseFeaturedIds(value) {
  return String(value ?? '').split(/[\n,]+/).map((id) => id.trim()).filter(Boolean);
}

function sortByIds(rows, ids) {
  if (!ids.length) return rows;
  const rank = new Map(ids.map((id, index) => [id, index]));
  return [...rows].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}


async function readTable(query, fallback = []) {
  const { data, error } = await query;
  if (error) return fallback;
  return data ?? fallback;
}

export async function GET() {
  try {
    const settings = await getHomepageSettings();
    const featuredTeamIds = parseFeaturedIds(settings.featured_team_ids);

    let teamQuery = supabaseAdmin
      .from('teams')
      .select(TEAM_FIELDS)
      .order('rank', { ascending: true, nullsLast: true })
      .limit(featuredTeamIds.length || 4);
    if (featuredTeamIds.length) teamQuery = teamQuery.in('id', featuredTeamIds);

    const [featuredAthletes, wagers, transfers, shopItems, tournaments, teams, companyProfile, stakeholders] = await Promise.all([
      getFeaturedAthletes(),
      readTable(supabaseAdmin.from('wagers').select(WAGER_FIELDS).eq('status', 'Active').eq('featured_on_home', true).order('hot', { ascending: false }).order('closes_at', { ascending: true }).limit(3)),
      readTable(supabaseAdmin.from('transfers').select(TRANSFER_FIELDS).order('date', { ascending: false }).limit(4)),
      readTable(supabaseAdmin.from('shop_items').select(SHOP_FIELDS).limit(4)),
      readTable(supabaseAdmin.from('tournaments').select(TOURNAMENT_FIELDS).in('status', ['Upcoming', 'Live']).order('start_date', { ascending: true }).limit(4)),
      readTable(teamQuery),
      getCompanyProfile(),
      listStakeholders({ limit: 6 }),
    ]);

    return NextResponse.json({
      featuredAthletes,
      athletes: featuredAthletes.map((item) => item.athlete).filter(Boolean),
      wagers,
      transfers,
      shopItems,
      tournaments,
      teams: sortByIds(teams, featuredTeamIds),
      homepageSettings: { ...DEFAULT_HOMEPAGE_SETTINGS, ...settings },
      companyProfile,
      stakeholders,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
