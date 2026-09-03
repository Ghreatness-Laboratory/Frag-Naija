'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { type Game, GAMES } from '@/lib/games';

interface GameContextValue {
  /** The currently active game. Null means the user is in a neutral all-games context. */
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
  /** True once localStorage has been read on the client. */
  isHydrated: boolean;
}

const GameContext = createContext<GameContextValue>({
  selectedGame: null,
  setSelectedGame: () => {},
  isHydrated: false,
});

const LS_KEY = 'fn-selected-game';
const COOKIE_NAME = 'fn-game';

export function GameProvider({ children }: { children: ReactNode }) {
  const [selectedGame, setGameState] = useState<Game | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setGameState(null);
      localStorage.removeItem(LS_KEY);
      setIsHydrated(true);
      return;
    }

    const stored = localStorage.getItem(LS_KEY);
    const preferredSlug = user.preferred_game_slug || stored;
    const found = GAMES.find((g) => g.slug === preferredSlug && g.available) ?? null;
    setGameState(found);
    setIsHydrated(true);
  }, [authLoading, user]);

  const setSelectedGame = useCallback((game: Game | null) => {
    setGameState(game);
    if (!game) {
      localStorage.removeItem(LS_KEY);
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
      return;
    }
    localStorage.setItem(LS_KEY, game.slug);
    // Cookie lets the middleware know a game has been chosen (1-year expiry)
    document.cookie = `${COOKIE_NAME}=${game.slug}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  return (
    <GameContext.Provider value={{ selectedGame, setSelectedGame, isHydrated }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
