import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getCurrentUser } from '@/features/auth/server';
import { getFantasySquadBudget, FC_MOBILE_MAX_NINETY_PLUS, fantasyTeamLimitViolation, calculateFantasyBasePrice } from '@/lib/fantasy-pricing';
import { calculateAthleteOverallRating } from '@/lib/athlete-rating';

export const dynamic = 'force-dynamic';

function getAthleteEffectiveRating(athlete) {
  const calculated = calculateAthleteOverallRating(athlete, athlete.game_slug);
  if (Number.isFinite(Number(calculated))) return Number(calculated);
  return Number(athlete.overall_rating ?? athlete.rating ?? 0);
}

function getAthleteEffectivePrice(athlete) {
  const explicit = Number(athlete.fantasy_price);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return calculateFantasyBasePrice(athlete);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      game_slug = 'pubg-mobile',
      starter_ids = [],
      bench_ids = [],
      captain_id = '',
      active_chip = null,
      user_id = null,
    } = body;

    const allIds = [...starter_ids, ...bench_ids];

    if (starter_ids.length !== 4) {
      return NextResponse.json({ error: 'Starting 4 requires exactly 4 players.' }, { status: 400 });
    }
    if (bench_ids.length !== 2) {
      return NextResponse.json({ error: 'Bench requires exactly 2 players.' }, { status: 400 });
    }
    if (new Set(allIds).size !== 6) {
      return NextResponse.json({ error: 'Squad cannot contain duplicate players.' }, { status: 400 });
    }
    if (!captain_id || !starter_ids.includes(captain_id)) {
      return NextResponse.json({ error: 'Captain must be selected from your Starting 4.' }, { status: 400 });
    }

    // Retrieve athletes from database or fallback mock
    const { data: athletesData, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('id, name, ign, team, role, rating, overall_rating, attack, defense, iq, clutch, survival, aggression, game_slug, fantasy_price, fantasy_status')
      .in('id', allIds);

    if (athleteError) {
      return NextResponse.json({ error: athleteError.message || 'Failed to verify squad athletes.' }, { status: 500 });
    }

    const athletes = athletesData || [];
    if (athletes.length < 6) {
      // If some athlete IDs were not resolved in DB
      return NextResponse.json({ error: 'One or more selected athletes could not be verified in the roster.' }, { status: 400 });
    }

    // Check availability
    const unavailable = athletes.find((a) => a.fantasy_status && a.fantasy_status !== 'available');
    if (unavailable) {
      return NextResponse.json({ error: `${unavailable.ign || unavailable.name} is currently unavailable for selection.` }, { status: 400 });
    }

    // Check squad value against budget
    const squadValue = athletes.reduce((sum, a) => sum + getAthleteEffectivePrice(a), 0);
    const budget = getFantasySquadBudget(game_slug);

    if (squadValue > budget) {
      const formattedValue = '₦' + squadValue.toLocaleString('en-NG');
      const formattedBudget = '₦' + budget.toLocaleString('en-NG');
      return NextResponse.json({
        error: `Squad value (${formattedValue}) exceeds the ${formattedBudget} budget limit for ${game_slug === 'fc-mobile' ? 'FC Mobile' : 'this game'}.`,
        squad_value: squadValue,
        budget,
      }, { status: 400 });
    }

    // FC Mobile 90+ rating backstop rule
    if (game_slug === 'fc-mobile') {
      const ninetyPlusAthletes = athletes.filter((a) => getAthleteEffectiveRating(a) >= 90);
      if (ninetyPlusAthletes.length > FC_MOBILE_MAX_NINETY_PLUS) {
        const names = ninetyPlusAthletes.map((a) => `${a.ign || a.name} (${getAthleteEffectiveRating(a)})`).join(', ');
        return NextResponse.json({
          error: `FC Mobile squad limit exceeded: A squad can contain at most ${FC_MOBILE_MAX_NINETY_PLUS} players rated 90+. Found ${ninetyPlusAthletes.length}: ${names}.`,
          ninety_plus_count: ninetyPlusAthletes.length,
          max_allowed: FC_MOBILE_MAX_NINETY_PLUS,
        }, { status: 400 });
      }
    }

    // Team limits (non-football games)
    const teamLimitMsg = fantasyTeamLimitViolation(athletes);
    if (teamLimitMsg) {
      return NextResponse.json({ error: teamLimitMsg }, { status: 400 });
    }

    // Persist squad in fantasy_squads if user_id is available
    const remaining_budget = budget - squadValue;
    let effectiveUserId = user_id;
    if (!effectiveUserId) {
      try {
        const currentUser = await getCurrentUser();
        effectiveUserId = currentUser?.id || null;
      } catch {}
    }

    if (effectiveUserId) {
      const { error: squadSaveError } = await supabaseAdmin.from('fantasy_squads').upsert({
        user_id: effectiveUserId,
        game_slug,
        starter_ids,
        bench_ids,
        captain_id,
        squad_value: squadValue,
        remaining_budget,
        active_chip: active_chip || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,game_slug' });

      if (squadSaveError) {
        return NextResponse.json({
          error: squadSaveError.message || 'Failed to save fantasy squad to database.',
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      game_slug,
      squad_value: squadValue,
      budget,
      remaining_budget,
      starter_ids,
      bench_ids,
      captain_id,
      ninety_plus_count: athletes.filter((a) => getAthleteEffectiveRating(a) >= 90).length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal error validating fantasy squad.' }, { status: 500 });
  }
}
