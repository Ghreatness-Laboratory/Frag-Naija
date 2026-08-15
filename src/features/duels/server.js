import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const DUEL_ODDS_STEEPNESS = 0.05;
export const DUEL_ODDS_MARGIN = 0.92;

function roundOdds(value) { return Math.round(value * 100) / 100; }
export function calculateDuelOdds(playerARating, playerBRating) {
  const ratingDiff = Number(playerARating || 0) - Number(playerBRating || 0);
  const probabilityA = 1 / (1 + Math.pow(10, -ratingDiff * DUEL_ODDS_STEEPNESS));
  const probabilityB = 1 - probabilityA;
  return { odds_a: roundOdds((1 / probabilityA) * DUEL_ODDS_MARGIN), odds_b: roundOdds((1 / probabilityB) * DUEL_ODDS_MARGIN) };
}
function ratingOf(a) { return Number(a?.overall_rating ?? a?.rating ?? 0); }
export async function createDuelMatch({ player_a_id, player_b_id, game_slug = 'pubg-mobile' }) {
  if (!player_a_id || !player_b_id || player_a_id === player_b_id) throw new Error('Select two different athletes');
  const { data: athletes, error } = await supabaseAdmin.from('athletes').select('id,name,ign,overall_rating,rating,game_slug').in('id', [player_a_id, player_b_id]);
  if (error) throw error;
  const a = athletes?.find((x) => x.id === player_a_id); const b = athletes?.find((x) => x.id === player_b_id);
  if (!a || !b) throw new Error('Athlete not found');
  if (game_slug && (a.game_slug !== game_slug || b.game_slug !== game_slug)) throw new Error('Both athletes must belong to the selected game');
  const player_a_rating = ratingOf(a); const player_b_rating = ratingOf(b);
  const odds = calculateDuelOdds(player_a_rating, player_b_rating);
  const { data, error: insertError } = await supabaseAdmin.from('duel_matches').insert([{ game_slug, mode: 'tdm_1v1', player_a_id, player_b_id, player_a_rating, player_b_rating, ...odds }]).select('*, player_a:athletes!duel_matches_player_a_id_fkey(id,name,ign,photo_url), player_b:athletes!duel_matches_player_b_id_fkey(id,name,ign,photo_url)').single();
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
  const { data: duel, error } = await supabaseAdmin.from('duel_matches').select('*').eq('id', duel_id).single();
  if (error) throw error;
  if (duel.status !== 'open') throw new Error('Duel is not open for wagers');
  const isA = picked_player_id === duel.player_a_id; const isB = picked_player_id === duel.player_b_id;
  if (!isA && !isB) throw new Error('Pick one of the duel players');
  const odds = Number(isA ? duel.odds_a : duel.odds_b); const potential = Math.round(numericStake * odds * 100) / 100;
  const { data: wallet, error: walletError } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', user_id).single();
  if (walletError || !wallet) throw new Error('Wallet not found');
  if (Number(wallet.balance) < numericStake) throw new Error('Insufficient wallet balance');
  await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) - numericStake, updated_at: new Date().toISOString() }).eq('user_id', user_id);
  const { data, error: insertError } = await supabaseAdmin.from('duel_wagers').insert([{ duel_id, user_id, picked_player_id, stake: numericStake, odds_at_placement: odds, potential_payout: potential }]).select('*').single();
  if (insertError) throw insertError;
  await supabaseAdmin.from('wallet_transactions').insert([{ user_id, type: 'Stake', amount: -numericStake, currency: 'NGN', description: `TDM 1V1 stake — duel ${duel_id}` }]);
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
    const { data: wallet } = await supabaseAdmin.from('wallets').select('balance,total_won').eq('user_id', wager.user_id).single();
    if (wallet) await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) + Number(wager.potential_payout), total_won: Number(wallet.total_won || 0) + Number(wager.potential_payout), updated_at: new Date().toISOString() }).eq('user_id', wager.user_id);
    await supabaseAdmin.from('wallet_transactions').insert([{ user_id: wager.user_id, type: 'Payout', amount: Number(wager.potential_payout), currency: 'NGN', description: `TDM 1V1 payout — duel ${id}` }]);
    winners += 1;
  }
  return { settled: true, winners, losers };
}
