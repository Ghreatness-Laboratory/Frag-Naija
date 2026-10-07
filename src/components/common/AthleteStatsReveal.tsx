'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Brain, Trophy } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';
import { chessRating, isChessGame } from '@/lib/athlete-display';

const SIGNAL_GREEN = '#4dff6e';

interface StatBlockProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}

function StatBlock({ icon, label, value, color = SIGNAL_GREEN }: StatBlockProps) {
  return (
    <div className="border border-fn-gborder bg-fn-card/50 p-2">
      <div className="flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        <p className="text-[9px] font-black uppercase tracking-widest text-fn-muted">{label}</p>
      </div>
      <p className="mt-1 text-lg font-black" style={{ color }}>{value}</p>
    </div>
  );
}

interface AthleteStatsRevealProps {
  athlete: {
    name: string;
    photo_url?: string | null;
    overall_rating?: number | string | null;
    attack?: number | null;
    defense?: number | null;
    iq?: number | null;
    rating?: number | string | null;
    game_slug?: string | null;
  };
  side: 'left' | 'right';
  reduceMotion: boolean;
}

export function AthleteStatsReveal({ athlete, side, reduceMotion }: AthleteStatsRevealProps) {
  const stats = {
    attack: Number(athlete.attack ?? 50),
    defense: Number(athlete.defense ?? 50),
    iq: Number(athlete.iq ?? 50)
  };

  const rating = Number(athlete.overall_rating ?? 0);
  const isChess = isChessGame(athlete.game_slug);

  return (
    <motion.div
      initial={reduceMotion ? false : { x: side === 'left' ? '-120%' : '120%', filter: 'blur(14px)', opacity: 0 }}
      animate={{ x: 0, filter: 'blur(0px)', opacity: 1 }}
      transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.2, 1.4, 0.4, 1] }}
      className="flex flex-col items-center gap-3"
    >
      {/* Portrait */}
      <div className="relative w-full max-w-[220px] aspect-[3/4] overflow-hidden border border-fn-gborder bg-fn-card">
        {athlete.photo_url ? (
          <OptimizedImage
            src={athlete.photo_url}
            alt=""
            className="h-full w-full object-cover brightness-[.85]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-fn-green">
            <Shield size={48} />
          </div>
        )}

        {/* Shooter cards retain the overall badge; Chess has one Rating metric below. */}
        {!isChess && (
          <div className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-sm border-2 border-fn-green bg-fn-black/90">
            <span className="text-sm font-black text-fn-green">{rating}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <h2 className="text-center text-lg font-black uppercase tracking-wider text-fn-text">
        {athlete.name.split(' ').pop() || athlete.name}
      </h2>

      {/* Chess genuinely renders a different metric tree, not hidden shooter stats. */}
      {isChess ? (
        <div className="w-full max-w-[220px]">
          <StatBlock icon={<Trophy size={12} />} label="Rating" value={chessRating(athlete.overall_rating, athlete.rating)} />
        </div>
      ) : (
        <div className="grid w-full max-w-[220px] grid-cols-3 gap-1.5">
          <StatBlock icon={<Zap size={12} />} label="ATK" value={stats.attack} />
          <StatBlock icon={<Shield size={12} />} label="DEF" value={stats.defense} />
          <StatBlock icon={<Brain size={12} />} label="IQ" value={stats.iq} />
        </div>
      )}
    </motion.div>
  );
}
