'use client';

import { motion } from 'framer-motion';
import { Trophy, Award, TrendingUp } from 'lucide-react';
import type { DuelPlayer } from './DuelSimViewer';

interface DuelResultScreenProps {
  playerAName: string;
  playerBName: string;
  winner: 'a' | 'b';
  finalKills: number;
  mvp?: DuelPlayer;
  stake: number;
  odds: number;
  pickedPlayer: 'a' | 'b';
  onReturnHome: () => void;
}

export function DuelResultScreen({
  playerAName,
  playerBName,
  winner,
  finalKills,
  mvp,
  stake,
  odds,
  pickedPlayer,
  onReturnHome
}: DuelResultScreenProps) {
  const userWon = pickedPlayer === winner;
  const payout = userWon ? Number((stake * odds).toFixed(2)) : 0;
  const profit = userWon ? payout - stake : -stake;
  
  const winnerName = winner === 'a' ? playerAName : playerBName;
  const loserName = winner === 'a' ? playerBName : playerAName;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* Winner Banner */}
      <div className="relative w-full max-w-2xl overflow-hidden border border-fn-green bg-fn-green/10 p-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
          className="absolute left-4 top-4"
        >
          <Trophy className="h-8 w-8 text-fn-green" />
        </motion.div>
        
        <p className="fn-label text-fn-green">DUEL COMPLETE</p>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-2 text-3xl font-black uppercase tracking-widest text-fn-text sm:text-4xl"
        >
          <span className="text-fn-green">{winnerName}</span> WINS
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-4 flex items-center justify-center gap-6"
        >
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-fn-muted">{playerAName}</p>
            <p className={`text-4xl font-black ${winner === 'a' ? 'text-fn-green drop-shadow-[0_0_15px_rgba(77,255,110,.8)]' : 'text-fn-muted'}`}>
              {winner === 'a' ? finalKills : Math.max(0, finalKills - 2 - Math.floor(Math.random() * 3))}
            </p>
          </div>
          <div className="text-2xl font-black text-fn-gborder">VS</div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-fn-muted">{playerBName}</p>
            <p className={`text-4xl font-black ${winner === 'b' ? 'text-fn-green drop-shadow-[0_0_15px_rgba(77,255,110,.8)]' : 'text-fn-muted'}`}>
              {winner === 'b' ? finalKills : Math.max(0, finalKills - 2 - Math.floor(Math.random() * 3))}
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* MVP Card */}
      {mvp && mvp.eliminations > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="w-full max-w-md border border-fn-gborder bg-fn-card p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-fn-green" />
            <p className="fn-label">MVP OF THE DUEL</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center border border-fn-green/30 bg-fn-green/10">
              <span className="text-2xl font-black text-fn-green">{mvp.eliminations}</span>
            </div>
            <div>
              <p className="text-lg font-black uppercase tracking-wider text-fn-text">{mvp.name}</p>
              <p className="text-xs font-mono text-fn-muted">
                {mvp.team === 'a' ? playerAName : playerBName} • {mvp.eliminations} Eliminations
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Wager Result */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className={`w-full max-w-md border p-5 ${userWon ? 'border-fn-green bg-fn-green/10' : 'border-fn-gborder bg-fn-card'}`}
      >
        <div className="mb-3 flex items-center gap-2">
          {userWon ? (
            <TrendingUp className="h-5 w-5 text-fn-green" />
          ) : (
            <TrendingUp className="h-5 w-5 text-fn-muted" />
          )}
          <p className={`fn-label ${userWon ? 'text-fn-green' : 'text-fn-muted'}`}>
            {userWon ? 'VICTORY' : 'DEFEAT'}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-fn-muted">Your Pick:</span>
            <span className="font-bold text-fn-text">
              {pickedPlayer === 'a' ? playerAName : playerBName} @ {odds.toFixed(2)}x
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-fn-muted">Stake:</span>
            <span className="font-bold text-fn-text">₦{stake.toLocaleString()}</span>
          </div>
          <div className="border-t border-fn-gborder pt-2">
            <div className="flex justify-between">
              <span className="text-fn-muted">Result:</span>
              <span className={`font-black ${userWon ? 'text-fn-green' : 'text-fn-muted'}`}>
                {userWon ? `+₦${profit.toLocaleString()}` : `-₦${stake.toLocaleString()}`}
              </span>
            </div>
          </div>
          {userWon && (
            <div className="border-t border-fn-green/30 pt-2">
              <div className="flex justify-between">
                <span className="fn-label text-fn-green">TOTAL PAYOUT</span>
                <span className="text-xl font-black text-fn-green">₦{payout.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Action Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        onClick={onReturnHome}
        className="w-full max-w-md bg-fn-green px-6 py-4 text-sm font-black uppercase tracking-widest text-fn-black hover:brightness-110"
      >
        Return to Virtual Games
      </motion.button>
    </motion.div>
  );
}
