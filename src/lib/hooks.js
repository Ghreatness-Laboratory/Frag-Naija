'use client';

/**
 * React hooks for data fetching from the Frag Naija Django API.
 */

import { useState, useEffect, useCallback } from 'react';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://frag-naija-backend.onrender.com';

// Helper to get auth headers for protected Django endpoints
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('django_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

function useFetch(endpoint, deps = [], options = {}) {
  const { retries = 0, onRetryError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const url = endpoint ? `${BASE_URL}${endpoint}` : null;

  const refetch = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    
    let lastError = null;
    for (let attempt = 0; attempt <= Math.min(retries, MAX_RETRIES); attempt++) {
      try {
        const res = await fetch(url, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.detail || err.error || `HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
        lastError = null;
        break;
      } catch (e) {
        lastError = e.message;
        if (attempt < Math.min(retries, MAX_RETRIES)) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        }
      }
    }
    
    if (lastError) {
      setError(lastError);
      if (onRetryError) onRetryError(lastError);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps, retries, onRetryError]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── Athletes ───────────────────────────────────────────────────────────────────────

export function useAthletes(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  return useFetch(`/api/athletes/${params ? `?${params}` : ''}`);
}

export function useAthlete(id) {
  return useFetch(id ? `/api/athletes/${id}/` : null);
}

// ─── Teams ──────────────────────────────────────────────────────────────────────────

export function useTeams(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  return useFetch(`/api/teams/${params ? `?${params}` : ''}`);
}

export function useTeam(id) {
  return useFetch(id ? `/api/teams/${id}/` : null);
}

// ─── Transfers ────────────────────────────────────────────────────────────────────

export function useTransfers(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  return useFetch(`/api/transfers/${params ? `?${params}` : ''}`);
}

// ─── Tournaments ─────────────────────────────────────────────────────────────────

export function useTournaments(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  return useFetch(`/api/tournaments/${params ? `?${params}` : ''}`);
}

// ─── Wagers ────────────────────────────────────────────────────────────────────────

export function useActiveWagers() {
  return useFetch('/api/wagers/?status=Active');
}

export function useWager(id) {
  return useFetch(id ? `/api/wagers/${id}/` : null);
}

export function useMyWagers() {
  return useFetch('/api/wagers/'); // Django will filter by authenticated user
}

export function useWalletTransactions(limit = 10) {
  return useFetch(`/api/transactions/?limit=${limit}`, [limit]);
}

export function useHighlights(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  return useFetch(`/api/highlights/${params ? `?${params}` : ''}`);
}

// ─── Auth ──────────────────────────────────────────────────────────────────────────

export function useMe() {
  return useFetch('/api/auth/me/', [], { retries: 1 });
}

export function useBanks() {
  return useFetch('/api/bank-accounts/');
}

export function useWithdraw() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function withdraw(body) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/withdrawals/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Withdrawal failed');
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { withdraw, loading, error };
}

// ─── Wager actions ───────────────────────────────────────────────────────────

export function usePlaceWager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function placeWager(body) {
    setLoading(true);
    setError(null);
    try {
      // Points to Django's wager-bets endpoint
      const res = await fetch(`${BASE_URL}/api/wager-bets/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Wager failed');
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

// ─── News / Featured ────────────────────────────────────────────

export function useNews(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  return useFetch(`/api/news/${params ? `?${params}` : ''}`);
}

export function useFeatured() {
  return useFetch('/api/homepage-featured/');
}
