'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
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

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const found = GAMES.find((g) => g.slug === stored);
      if (found) setGameState(found);
    }
    setIsHydrated(true);
  }, []);

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
