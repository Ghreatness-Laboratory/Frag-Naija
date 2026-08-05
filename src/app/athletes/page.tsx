'use client';

import { useState } from 'react';
import { useAthletes } from '@/lib/hooks';
import Link from 'next/link';
import { Shield, User, TrendingUp } from 'lucide-react';

export default function AthletesPage() {
  const [selectedGame, setSelectedGame] = useState('pubg-mobile');
  
  const { data: athletesData, loading, error } = useAthletes({ 
    game_slug: selectedGame 
  });

  const athletes = athletesData?.results || [];

  return (
    <div className="min-h-screen bg-fn-black p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-fn-text font-mono tracking-widest uppercase mb-4">
            Athletes
          </h1>
          
          {/* Game Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['pubg-mobile', 'ea-fc-26', 'free-fire', 'cod-mobile'].map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded border text-xs font-bold uppercase tracking-widest whitespace-nowrap ${
                  selectedGame === game
                    ? 'bg-fn-green text-fn-black border-fn-green'
                    : 'bg-fn-card text-fn-muted border-fn-gborder hover:border-fn-green/50'
                }`}
              >
                {game.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-fn-green border-t-transparent" />
            <p className="text-fn-muted mt-4 text-sm uppercase tracking-widest">Loading athletes...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-fn-red/10 border border-fn-red/30 rounded p-6 text-center">
            <Shield className="w-12 h-12 text-fn-red mx-auto mb-3" />
            <p className="text-fn-red font-bold uppercase tracking-widest mb-2">Failed to Load</p>
            <p className="text-fn-muted text-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && athletes.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-fn-green mx-auto mb-4" />
            <p className="text-fn-text font-bold text-lg uppercase tracking-widest mb-2">
              No {selectedGame.replace('-', ' ').toUpperCase()} Athletes Yet
            </p>
            <p className="text-fn-muted text-sm mb-6">
              New tactical operators will appear here as soon as they are registered.
            </p>
            <Link 
              href="/athletes/icons"
              className="inline-block border border-fn-green text-fn-green px-6 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-fn-green hover:text-fn-black transition-colors"
            >
              View Icons
            </Link>
          </div>
        )}

        {/* Athletes Grid */}
        {!loading && !error && athletes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {athletes.map((athlete) => (
              <Link
                key={athlete.id}
                href={`/athletes/${athlete.id}`}
                className="bg-fn-card border border-fn-gborder rounded-lg p-4 hover:border-fn-green/50 hover:bg-fn-green/5 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-fn-green/10 border border-fn-green/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-fn-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-fn-text text-sm truncate group-hover:text-fn-green transition-colors">
                      {athlete.name}
                    </h3>
                    <p className="text-fn-muted text-xs truncate">@{athlete.username}</p>
                  </div>
                </div>
                
                {athlete.ign && (
                  <p className="text-fn-muted text-xs mb-3">
                    IGN: <span className="text-fn-text">{athlete.ign}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-fn-dark rounded px-2 py-1">
                    <span className="text-fn-muted">ATT:</span>
                    <span className="text-fn-green ml-1 font-bold">{athlete.att || 0}</span>
                  </div>
                  <div className="bg-fn-dark rounded px-2 py-1">
                    <span className="text-fn-muted">DEF:</span>
                    <span className="text-fn-green ml-1 font-bold">{athlete.def_stat || 0}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-fn-muted">Rating:</span>
                  <span className="text-fn-yellow font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {athlete.rtg || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
