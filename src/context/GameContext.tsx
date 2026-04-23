'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { type Game, GAMES, DEFAULT_GAME } from '@/lib/games';

interface GameContextValue {
  /** The currently active game. Defaults to PUBG Mobile before hydration. */
  selectedGame: Game;
  setSelectedGame: (game: Game) => void;
  /** True once localStorage has been read on the client. */
  isHydrated: boolean;
}

const GameContext = createContext<GameContextValue>({
  selectedGame: DEFAULT_GAME,
  setSelectedGame: () => {},
  isHydrated: false,
});

const LS_KEY = 'fn-selected-game';
const COOKIE_NAME = 'fn-game';

export function GameProvider({ children }: { children: ReactNode }) {
  const [selectedGame, setGameState] = useState<Game>(DEFAULT_GAME);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const found = GAMES.find((g) => g.slug === stored);
      if (found) setGameState(found);
    }
    setIsHydrated(true);
  }, []);

  const setSelectedGame = useCallback((game: Game) => {
    setGameState(game);
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
