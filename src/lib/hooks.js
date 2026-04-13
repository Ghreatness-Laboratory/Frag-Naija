'use client';

/**
 * React hooks for data fetching from the Frag Naija API.
 * All hooks return { data, loading, error } and re-fetch when filters change.
 */

import { useState, useEffect, useCallback } from 'react';

function useFetch(url, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── Athletes ────────────────────────────────────────────────────────────────

export function useAthletes(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return useFetch(`/api/athletes${params ? `?${params}` : ''}`);
}

export function useAthlete(id) {
  return useFetch(id ? `/api/athletes/${id}` : null);
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export function useTeams() {
  return useFetch('/api/teams');
}

export function useTeam(id) {
  return useFetch(id ? `/api/teams/${id}` : null);
}

// ─── Transfers ───────────────────────────────────────────────────────────────

export function useTransfers(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return useFetch(`/api/transfers${params ? `?${params}` : ''}`);
}

// ─── Tournaments ─────────────────────────────────────────────────────────────

export function useTournaments(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return useFetch(`/api/tournaments${params ? `?${params}` : ''}`);
}

// ─── Wagers ──────────────────────────────────────────────────────────────────

export function useActiveWagers() {
  return useFetch('/api/wagers/active');
}

export function useWager(id) {
  return useFetch(id ? `/api/wagers/${id}` : null);
}

// ─── Highlights ──────────────────────────────────────────────────────────────

export function useHighlights(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return useFetch(`/api/highlights${params ? `?${params}` : ''}`);
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useMe() {
  return useFetch('/api/auth/me');
}

// ─── Wager actions ───────────────────────────────────────────────────────────

/**
 * Returns a function to call the Paystack payment initializer.
 * Usage:
 *   const { placeWager, loading, error } = usePlaceWager();
 *   const { authorization_url } = await placeWager({ wager_id, selection, amount, email });
 */
export function usePlaceWager() {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  async function placeWager(body) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wager/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { placeWager, loading, error };
}
