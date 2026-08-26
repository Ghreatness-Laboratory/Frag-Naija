import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { calculateDuelOddsFromElo, calculateDuelOddsFromKd, eloOf, kdOf } from '@/lib/duel-odds';
import { MIN_STAKE_NGN } from '@/features/wagers/constants';

export function calculateDuelOdds(playerAKd, playerBKd) {
  return calculateDuelOddsFromKd(playerAKd, playerBKd);
}

function ratingOf(a, gameSlug) { return gameSlug === 'chess' ? eloOf(a) : kdOf(a); }
export async function createDuelMatch({ player_a_id, player_b_id, game_slug = 'pubg-mobile', mode: requested_mode }) {
  if (!player_a_id || !player_b_id || player_a_id === player_b_id) throw new Error('Select two different athletes');
  const { data: athletes, error } = await supabaseAdmin.from('athletes').select('id,name,ign,overall_rating,rating,kills,game_slug').in('id', [player_a_id, player_b_id]);
  if (error) throw error;
  const a = athletes?.find((x) => x.id === player_a_id); const b = athletes?.find((x) => x.id === player_b_id);
  if (!a || !b) throw new Error('Athlete not found');
  if (game_slug && (a.game_slug !== game_slug || b.game_slug !== game_slug)) throw new Error('Both athletes must belong to the selected game');
  const player_a_rating = ratingOf(a, game_slug); const player_b_rating = ratingOf(b, game_slug);
  const odds = game_slug === 'chess' ? calculateDuelOddsFromElo(player_a_rating, player_b_rating) : calculateDuelOdds(player_a_rating, player_b_rating);
  const mode = game_slug === 'chess' ? (requested_mode || 'rapid_1v1') : 'tdm_1v1';
  const { data, error: insertError } = await supabaseAdmin.from('duel_matches').insert([{ game_slug, mode, player_a_id, player_b_id, player_a_rating, player_b_rating, ...odds }]).select('*, player_a:athletes!duel_matches_player_a_id_fkey(id,name,ign,photo_url), player_b:athletes!duel_matches_player_b_id_fkey(id,name,ign,photo_url)').single();
  if (insertError) throw insertError;
  return data;
}
export async function getOpenDuelMatches() {
  const { data, error } = await supabaseAdmin.from('duel_matches').select('*, player_a:athletes!duel_matches_player_a_id_fkey(id,name,ign), player_b:athletes!duel_matches_player_b_id_fkey(id,name,ign), winner:athletes!duel_matches_winner_id_fkey(id,name,ign)').order('created_at', { ascending: false });
  if (error) throw error; return data;
}
export async function placeDuelWager({ duel_id, user_id, picked_player_id, stake }) {
  const numericStake = Number(stake);
  if (!duel_id || !user_id || !picked_player_id || !Number.isFinite(numericStake) || numericStake <= 0) throw new Error('duel_id, picked_player_id, and valid stake are required');
  if (numericStake < MIN_STAKE_NGN) throw new Error(`Minimum stake is ₦${MIN_STAKE_NGN.toLocaleString('en-NG')}`);
  const { data: duel, error } = await supabaseAdmin.from('duel_matches').select('*').eq('id', duel_id).single();
  if (error) throw error;
  if (duel.status !== 'open') throw new Error('Duel is not open for wagers');
  const isA = picked_player_id === duel.player_a_id; const isB = picked_player_id === duel.player_b_id;
  if (!isA && !isB) throw new Error('Pick one of the duel players');
  const odds = Number(isA ? duel.odds_a : duel.odds_b); const potential = Math.round(numericStake * odds * 100) / 100;
  const { data, error: insertError } = await supabaseAdmin.rpc('place_duel_wager_from_wallet', {
    p_duel_id: duel_id,
    p_user_id: user_id,
    p_picked_player_id: picked_player_id,
    p_stake: numericStake,
    p_odds: odds,
    p_potential_payout: potential,
  });
  if (insertError) throw insertError;
  return data;
}
export async function settleDuelMatch(id, winner_id) {
  const { data: duel, error } = await supabaseAdmin.from('duel_matches').select('*').eq('id', id).single();
  if (error) throw error;
  if (![duel.player_a_id, duel.player_b_id].includes(winner_id)) throw new Error('Winner must be one of the duel players');
  await supabaseAdmin.from('duel_matches').update({ status: 'settled', winner_id, settled_at: new Date().toISOString() }).eq('id', id);
  const { data: wagers, error: wagersError } = await supabaseAdmin.from('duel_wagers').select('*').eq('duel_id', id).eq('status', 'pending');
  if (wagersError) throw wagersError;
  let winners = 0, losers = 0;
  for (const wager of wagers || []) {
    const won = wager.picked_player_id === winner_id;
    await supabaseAdmin.from('duel_wagers').update({ status: won ? 'won' : 'lost', settled_at: new Date().toISOString() }).eq('id', wager.id);
    if (!won) { losers += 1; continue; }
    const { error: payoutError } = await supabaseAdmin.rpc('credit_duel_payout', {
      p_user_id: wager.user_id,
      p_amount: Number(wager.potential_payout),
      p_description: `1V1 payout — duel ${id}`,
    });
    if (payoutError) throw payoutError;
    winners += 1;
  }
  return { settled: true, winners, losers };
}
