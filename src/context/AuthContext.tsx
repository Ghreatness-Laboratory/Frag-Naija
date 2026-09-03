'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AuthUser = {
  id?: string;
  email?: string;
  username?: string;
  preferred_game_slug?: string | null;
  date_of_birth?: string | null;
  provider?: string;
  totp_enabled?: boolean;
  factors?: { id: string; status: string }[];
} | null;

type AuthContextValue = {
  user: AuthUser | undefined;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  loading: true,
  refresh: async () => {},
});

// Share the initial request between consumers and React strict-mode remounts.
let inFlightAuthRequest: Promise<AuthUser> | null = null;
let cachedAuthUser: AuthUser | undefined;

function fetchCurrentUser({ force = false } = {}) {
  if (!force && cachedAuthUser !== undefined) return Promise.resolve(cachedAuthUser);

  if (!inFlightAuthRequest) {
    inFlightAuthRequest = fetch('/api/auth/me', {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((user) => {
        cachedAuthUser = user;
        return user;
      })
      .finally(() => { inFlightAuthRequest = null; });
  }
  return inFlightAuthRequest;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | undefined>(undefined);

  const refresh = useCallback(async () => {
    const nextUser = await fetchCurrentUser({ force: true });
    setUser(nextUser);
  }, []);

  useEffect(() => {
    void fetchCurrentUser().then(setUser);
  }, []);

  const value = useMemo(() => ({ user, loading: user === undefined, refresh }), [user, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
