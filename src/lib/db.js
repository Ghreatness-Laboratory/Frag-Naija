/**
 * Centralized database helper functions.
 * All functions use the admin client (service role) and throw on error.
 * Errors are caught in the route handlers and converted to HTTP responses.
 */

import { supabaseAdmin } from './supabase-admin.js';

// ─── ATHLETES ────────────────────────────────────────────────────────────────

export async function getAthletes({ team, status } = {}) {
  let q = supabaseAdmin.from('athletes').select('*').order('rating', { ascending: false });
  if (team)   q = q.eq('team', team);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getAthleteById(id) {
  const { data, error } = await supabaseAdmin
    .from('athletes').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createAthlete(body) {
  const { data, error } = await supabaseAdmin
    .from('athletes').insert([body]).select().single();
  if (error) throw error;
  return data;
}

export async function updateAthlete(id, body) {
  const { data, error } = await supabaseAdmin
    .from('athletes').update(body).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAthlete(id) {
  const { error } = await supabaseAdmin.from('athletes').delete().eq('id', id);
  if (error) throw error;
}

// ─── TEAMS ────────────────────────────────────────────────────────────────────

export async function getTeams() {
  const { data: teams, error } = await supabaseAdmin
    .from('teams').select('*').order('wins', { ascending: false });
  if (error) throw error;

  // Attach player roster to each team
  const { data: athletes, error: ae } = await supabaseAdmin.from('athletes').select('*');
  if (ae) throw ae;

  return teams.map((t) => ({
    ...t,
    players: athletes.filter((a) => a.team === t.name),
  }));
}

export async function getTeamById(id) {
  const { data: team, error } = await supabaseAdmin
    .from('teams').select('*').eq('id', id).single();
  if (error) throw error;

  const { data: players, error: pe } = await supabaseAdmin
    .from('athletes').select('*').eq('team', team.name);
  if (pe) throw pe;

  return { ...team, players };
}

export async function createTeam(body) {
  const { data, error } = await supabaseAdmin
    .from('teams').insert([body]).select().single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id, body) {
  const { data, error } = await supabaseAdmin
    .from('teams').update(body).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id) {
  const { error } = await supabaseAdmin.from('teams').delete().eq('id', id);
  if (error) throw error;
}

// ─── TRANSFERS ────────────────────────────────────────────────────────────────

export async function getTransfers({ status } = {}) {
  let q = supabaseAdmin.from('transfers').select('*').order('date', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTransfer(body) {
  const { data, error } = await supabaseAdmin
    .from('transfers').insert([body]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTransfer(id) {
  const { error } = await supabaseAdmin.from('transfers').delete().eq('id', id);
  if (error) throw error;
}

// ─── TOURNAMENTS ──────────────────────────────────────────────────────────────

export async function getTournaments({ status } = {}) {
  let q = supabaseAdmin.from('tournaments').select('*').order('start_date', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getTournamentById(id) {
  const { data, error } = await supabaseAdmin
    .from('tournaments').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createTournament(body) {
  const { data, error } = await supabaseAdmin
    .from('tournaments').insert([body]).select().single();
  if (error) throw error;
  return data;
}

export async function updateTournamentStatus(id, status) {
  const { data, error } = await supabaseAdmin
    .from('tournaments').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTournament(id) {
  const { error } = await supabaseAdmin.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

// ─── WAGERS ───────────────────────────────────────────────────────────────────

export async function getWagers() {
  const { data, error } = await supabaseAdmin
    .from('wagers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveWagers() {
  const { data, error } = await supabaseAdmin
    .from('wagers')
    .select('*')
    .eq('status', 'Active')
    .gt('closes_at', new Date().toISOString())
    .order('hot', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getWagerById(id) {
  const { data: wager, error } = await supabaseAdmin
    .from('wagers').select('*').eq('id', id).single();
  if (error) throw error;

  const { data: bets, error: be } = await supabaseAdmin
    .from('wager_bets').select('selection, amount').eq('wager_id', id);
  if (be) throw be;

  const yesBets = bets.filter((b) => b.selection === 'YES');
  const noBets  = bets.filter((b) => b.selection === 'NO');

  return {
    ...wager,
    yes_count: yesBets.length,
    no_count:  noBets.length,
    yes_pool:  yesBets.reduce((s, b) => s + Number(b.amount), 0),
    no_pool:   noBets.reduce((s, b) => s + Number(b.amount), 0),
  };
}

export async function createWager(body) {
  const { data, error } = await supabaseAdmin
    .from('wagers').insert([body]).select().single();
  if (error) throw error;
  return data;
}

export async function toggleWagerHot(id) {
  const { data: wager, error: fe } = await supabaseAdmin
    .from('wagers').select('hot').eq('id', id).single();
  if (fe) throw fe;

  const { data, error } = await supabaseAdmin
    .from('wagers').update({ hot: !wager.hot }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function settleWager(id, outcome) {
  // 1. Mark wager as settled
  const status = outcome === 'YES' ? 'Settled — YES Wins' : 'Settled — NO Wins';
  const { error: we } = await supabaseAdmin
    .from('wagers').update({ status }).eq('id', id);
  if (we) throw we;

  // 2. Get the wager odds for payout calculation
  const { data: wager, error: wage } = await supabaseAdmin
    .from('wagers').select('yes_odds, no_odds').eq('id', id).single();
  if (wage) throw wage;

  // 3. Fetch all bets for this wager
  const { data: bets, error: be } = await supabaseAdmin
    .from('wager_bets').select('*').eq('wager_id', id).eq('status', 'Active');
  if (be) throw be;

  let winners = 0, losers = 0;

  for (const bet of bets) {
    const won = bet.selection === outcome;
    const newStatus = won ? 'Won' : 'Lost';

    // Update bet status
    await supabaseAdmin.from('wager_bets').update({ status: newStatus }).eq('id', bet.id);

    if (won) {
      // Credit wallet
      const odds = outcome === 'YES' ? wager.yes_odds : wager.no_odds;
      const payout = Number(bet.amount) * Number(odds);

      const { data: wallet } = await supabaseAdmin
        .from('wallets').select('balance, total_won').eq('user_id', bet.user_id).single();

      if (wallet) {
        await supabaseAdmin.from('wallets').update({
          balance:   Number(wallet.balance) + payout,
          total_won: Number(wallet.total_won) + payout,
          updated_at: new Date().toISOString(),
        }).eq('user_id', bet.user_id);
      }
      winners++;
    } else {
      losers++;
    }
  }

  return { settled: true, winners, losers };
}

export async function deleteWager(id) {
  // Prevent deletion if bets exist
  const { data: bets } = await supabaseAdmin
    .from('wager_bets').select('id').eq('wager_id', id).limit(1);
  if (bets && bets.length > 0) {
    throw new Error('Cannot delete a wager that has existing bets');
  }
  const { error } = await supabaseAdmin.from('wagers').delete().eq('id', id);
  if (error) throw error;
}

// ─── WAGER BETS ───────────────────────────────────────────────────────────────

export async function createWagerBet({ wager_id, user_id, email, selection, amount, potential, reference }) {
  // Idempotency: check if reference already processed
  const { data: existing } = await supabaseAdmin
    .from('wager_bets').select('id').eq('reference', reference).single();
  if (existing) return { duplicate: true };

  const { data, error } = await supabaseAdmin
    .from('wager_bets')
    .insert([{ wager_id, user_id, email, selection, amount, potential, reference, status: 'Active' }])
    .select().single();
  if (error) throw error;

  // Update pool total via RPC
  await supabaseAdmin.rpc('increment_wager_pool', { wager_id, amount });

  return data;
}

// ─── HIGHLIGHTS ───────────────────────────────────────────────────────────────

export async function getHighlights({ category } = {}) {
  let q = supabaseAdmin.from('highlights').select('*').order('date', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createHighlight(body) {
  const { data, error } = await supabaseAdmin
    .from('highlights').insert([body]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteHighlight(id) {
  const { error } = await supabaseAdmin.from('highlights').delete().eq('id', id);
  if (error) throw error;
}

// ─── WALLETS ──────────────────────────────────────────────────────────────────

export async function getWallet(userId) {
  const { data, error } = await supabaseAdmin
    .from('wallets').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data;
}

export async function createWallet(userId) {
  const { data, error } = await supabaseAdmin
    .from('wallets').insert([{ user_id: userId, balance: 0, total_won: 0, total_lost: 0 }])
    .select().single();
  if (error) throw error;
  return data;
}
