'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Zap, Target, Shield } from 'lucide-react';

const SIGNAL_GREEN = '#4dff6e';
const DANGER_RED = '#ff4d4d';
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 500;
const PLAYER_SIZE = 24;

export type DuelEventType = 
  | 'spawn'
  | 'movement'
  | 'gunfight'
  | 'grenade_throw'
  | 'grenade_detonation'
  | 'zone_damage'
  | 'elimination'
  | 'match_end';

export type DuelEvent = {
  time: number;
  event_type: DuelEventType;
  actor: string;
  target?: string;
  position?: { x: number; y: number };
  damage?: number;
  kill_method?: 'headshot' | 'body' | 'grenade' | 'zone';
};

export type DuelScript = {
  winner: 'a' | 'b';
  finalKills: number;
  events: DuelEvent[];
  duration: number;
};

export type DuelPlayer = {
  id: string;
  name: string;
  team: 'a' | 'b';
  x: number;
  y: number;
  hp: number;
  alive: boolean;
  eliminations: number;
  facing: 'left' | 'right';
};

interface DuelSimViewerProps {
  playerAName: string;
  playerBName: string;
  playerAStats?: { attack: number; defense: number; iq: number };
  playerBStats?: { attack: number; defense: number; iq: number };
  onMatchEnd: (result: { winner: 'a' | 'b'; kills: number; mvp?: DuelPlayer }) => void;
  onSkipToResult: () => void;
}

function generateDuelScript(
  playerAName: string,
  playerBName: string,
  playerAStats?: { attack: number; defense: number; iq: number },
  playerBStats?: { attack: number; defense: number; iq: number }
): DuelScript {
  // Predetermine winner based on stats or random
  const aPower = (playerAStats?.attack || 50) + (playerAStats?.iq || 50);
  const bPower = (playerBStats?.attack || 50) + (playerBStats?.iq || 50);
  const winner = aPower >= bPower ? 'a' : 'b';
  
  const winningKills = 8 + Math.floor(Math.random() * 5); // 8-12 kills
  const losingKills = Math.max(3, winningKills - 2 - Math.floor(Math.random() * 3));
  
  const events: DuelEvent[] = [];
  const duration = 35000; // 35 seconds playback
  
  // Spawn events
  events.push({
    time: 0,
    event_type: 'spawn',
    actor: 'a',
    position: { x: 100, y: ARENA_HEIGHT / 2 }
  });
  events.push({
    time: 0,
    event_type: 'spawn',
    actor: 'b',
    position: { x: ARENA_WIDTH - 100, y: ARENA_HEIGHT / 2 }
  });
  
  // Generate varied combat events
  const totalEvents = winningKills + losingKills;
  let currentTime = 1500;
  const timeStep = (duration - 5000) / totalEvents;
  
  let killsA = 0;
  let killsB = 0;
  
  for (let i = 0; i < totalEvents; i++) {
    const isTeamAKill = i < winningKills ? (winner === 'a' ? Math.random() > 0.3 : Math.random() > 0.7) : false;
    const killer = isTeamAKill ? 'a' : 'b';
    const victim = isTeamAKill ? 'b' : 'a';
    
    currentTime += timeStep * (0.8 + Math.random() * 0.4);
    
    // Choose event type based on context
    const eventTypeRoll = Math.random();
    let primaryEvent: DuelEventType = 'gunfight';
    let killMethod: 'headshot' | 'body' | 'grenade' | 'zone' = 'body';
    
    if (eventTypeRoll < 0.15 && i > 1) {
      primaryEvent = 'grenade_throw';
      killMethod = 'grenade';
    } else if (eventTypeRoll < 0.25 && i > 1) {
      primaryEvent = 'zone_damage';
      killMethod = 'zone';
    } else {
      killMethod = Math.random() > 0.7 ? 'headshot' : 'body';
    }
    
    const engagementPos = {
      x: ARENA_WIDTH / 2 + (Math.random() - 0.5) * 400,
      y: ARENA_HEIGHT / 2 + (Math.random() - 0.5) * 200
    };
    
    // Add pre-event for grenade/zone
    if (primaryEvent === 'grenade_throw') {
      events.push({
        time: Math.min(currentTime - 500, duration - 3000),
        event_type: 'grenade_throw',
        actor: killer,
        position: engagementPos
      });
      
      events.push({
        time: Math.min(currentTime, duration - 2000),
        event_type: 'grenade_detonation',
        actor: killer,
        target: victim,
        position: engagementPos,
        damage: 100,
        kill_method: killMethod
      });
    } else if (primaryEvent === 'zone_damage') {
      events.push({
        time: Math.min(currentTime - 800, duration - 3000),
        event_type: 'zone_damage',
        actor: victim,
        position: engagementPos,
        damage: 30
      });
      
      events.push({
        time: Math.min(currentTime, duration - 2000),
        event_type: 'elimination',
        actor: killer,
        target: victim,
        position: engagementPos,
        kill_method: killMethod
      });
    } else {
      // Gunfight
      events.push({
        time: Math.min(currentTime - 200, duration - 3000),
        event_type: 'gunfight',
        actor: killer,
        target: victim,
        position: engagementPos
      });
      
      events.push({
        time: Math.min(currentTime, duration - 2000),
        event_type: 'elimination',
        actor: killer,
        target: victim,
        position: engagementPos,
        kill_method: killMethod
      });
    }
    
    if (isTeamAKill) killsA++; else killsB++;
  }
  
  // Match end
  events.push({
    time: duration,
    event_type: 'match_end',
    actor: winner
  });
  
  events.sort((a, b) => a.time - b.time);
  
  return { winner, finalKills: winner === 'a' ? killsA : killsB, events, duration };
}

export function DuelSimViewer({
  playerAName,
  playerBName,
  playerAStats,
  playerBStats,
  onMatchEnd,
  onSkipToResult
}: DuelSimViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [script] = useState<DuelScript>(() => 
    generateDuelScript(playerAName, playerBName, playerAStats, playerBStats)
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [killFeed, setKillFeed] = useState<Array<{ id: number; text: string }>>([]);
  const [players, setPlayers] = useState<DuelPlayer[]>([]);
  const [matchEnded, setMatchEnded] = useState(false);
  const [zoneRadius, setZoneRadius] = useState(ARENA_WIDTH);
  const [activeEffects, setActiveEffects] = useState<Array<{ type: string; x: number; y: number; life: number }>[]>([]);
  
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const killFeedIdRef = useRef(0);
  const processedEventsRef = useRef<Set<number>>(new Set());
  
  // Initialize players
  useEffect(() => {
    setPlayers([
      {
        id: 'a',
        name: playerAName,
        team: 'a',
        x: 100,
        y: ARENA_HEIGHT / 2,
        hp: 100,
        alive: true,
        eliminations: 0,
        facing: 'right'
      },
      {
        id: 'b',
        name: playerBName,
        team: 'b',
        x: ARENA_WIDTH - 100,
        y: ARENA_HEIGHT / 2,
        hp: 100,
        alive: true,
        eliminations: 0,
        facing: 'left'
      }
    ]);
  }, [playerAName, playerBName]);
  
  // Process events
  const processEvents = useCallback((time: number) => {
    script.events.forEach((event, idx) => {
      if (processedEventsRef.current.has(idx)) return;
      if (event.time > time) return;
      
      processedEventsRef.current.add(idx);
      
      const attacker = players.find(p => p.id === event.actor);
      const victim = players.find(p => p.id === event.target);
      
      if (event.event_type === 'elimination' && victim) {
        const killerName = event.actor === 'a' ? playerAName : playerBName;
        const victimName = event.target === 'a' ? playerAName : playerBName;
        
        let methodText = '';
        switch (event.kill_method) {
          case 'headshot': methodText = '— HEADSHOT'; break;
          case 'grenade': methodText = '— GRENADE'; break;
          case 'zone': methodText = '— ZONE'; break;
          default: methodText = '';
        }
        
        setKillFeed(prev => [{
          id: killFeedIdRef.current++,
          text: `${killerName} ELIMINATED ${victimName} ${methodText}`
        }, ...prev].slice(0, 6));
        
        setPlayers(prev => prev.map(p => {
          if (p.id === event.actor) {
            return { ...p, eliminations: p.eliminations + 1 };
          }
          if (p.id === event.target) {
            return { ...p, alive: false, hp: 0 };
          }
          return p;
        }));
        
        // Respawn after delay
        setTimeout(() => {
          setPlayers(prev => prev.map(p => {
            if (p.id === event.target) {
              return {
                ...p,
                alive: true,
                hp: 100,
                x: event.target === 'a' ? 100 : ARENA_WIDTH - 100,
                y: ARENA_HEIGHT / 2
              };
            }
            return p;
          }));
        }, 2000);
      }
      
      if (event.event_type === 'zone_damage' && victim) {
        setPlayers(prev => prev.map(p => {
          if (p.id === event.target && p.alive) {
            return { ...p, hp: Math.max(0, p.hp - (event.damage || 30)) };
          }
          return p;
        }));
      }
      
      if (event.event_type === 'grenade_detonation' || event.event_type === 'gunfight') {
        setActiveEffects(prev => [...prev, {
          type: event.event_type,
          x: event.position?.x || 0,
          y: event.position?.y || 0,
          life: 1.0
        }]);
      }
    });
    
    // Update zone radius
    const progress = time / script.duration;
    setZoneRadius(ARENA_WIDTH * (1 - progress * 0.6));
    
    // Check match end
    if (time >= script.duration && !matchEnded) {
      setMatchEnded(true);
      const mvp = players.reduce((best, p) => 
        p.eliminations > best.eliminations ? p : best, players[0]
      );
      setTimeout(() => {
        onMatchEnd({ winner: script.winner, kills: script.finalKills, mvp });
      }, 1000);
    }
  }, [script, players, matchEnded, onMatchEnd, playerAName, playerBName]);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying || matchEnded) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    startTimeRef.current = performance.now() - pausedTimeRef.current;
    
    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const clampedTime = Math.min(elapsed, script.duration);
      
      setCurrentTime(clampedTime);
      processEvents(clampedTime);
      
      // Clear and draw background
      ctx.fillStyle = '#0a0f0c';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(77, 255, 110, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < ARENA_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, ARENA_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < ARENA_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(ARENA_WIDTH, i);
        ctx.stroke();
      }
      
      // Draw zone circle
      ctx.strokeStyle = 'rgba(255, 77, 77, 0.4)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.arc(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, zoneRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Zone danger area outside
      const gradient = ctx.createRadialGradient(
        ARENA_WIDTH / 2, ARENA_HEIGHT / 2, zoneRadius,
        ARENA_WIDTH / 2, ARENA_HEIGHT / 2, zoneRadius + 100
      );
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, 'rgba(255, 77, 77, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      
      // Draw effects
      activeEffects.forEach((effect, idx) => {
        if (effect.type === 'grenade_detonation') {
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, 30 * effect.life, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 100, 50, ${effect.life})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 200, 100, ${effect.life})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (effect.type === 'gunfight') {
          // Muzzle flash
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, 15 * effect.life, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 200, 50, ${effect.life})`;
          ctx.fill();
        }
      });
      
      // Decay effects
      setActiveEffects(prev => prev
        .map(e => ({ ...e, life: e.life - 0.05 }))
        .filter(e => e.life > 0)
      );
      
      // Draw players
      players.forEach(player => {
        if (!player.alive) return;
        
        // Player body
        ctx.fillStyle = player.team === 'a' ? SIGNAL_GREEN : DANGER_RED;
        ctx.beginPath();
        
        // Directional shape
        if (player.facing === 'right') {
          ctx.moveTo(player.x + PLAYER_SIZE/2, player.y);
          ctx.lineTo(player.x - PLAYER_SIZE/2, player.y - PLAYER_SIZE/2);
          ctx.lineTo(player.x - PLAYER_SIZE/2, player.y + PLAYER_SIZE/2);
        } else {
          ctx.moveTo(player.x - PLAYER_SIZE/2, player.y);
          ctx.lineTo(player.x + PLAYER_SIZE/2, player.y - PLAYER_SIZE/2);
          ctx.lineTo(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2);
        }
        ctx.closePath();
        ctx.fill();
        
        // Glow
        ctx.shadowColor = player.team === 'a' ? SIGNAL_GREEN : DANGER_RED;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // HP bar
        const hpBarWidth = 40;
        const hpBarHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x - hpBarWidth/2, player.y - PLAYER_SIZE - 10, hpBarWidth, hpBarHeight);
        ctx.fillStyle = player.hp > 50 ? SIGNAL_GREEN : player.hp > 25 ? '#ffaa00' : DANGER_RED;
        ctx.fillRect(player.x - hpBarWidth/2, player.y - PLAYER_SIZE - 10, hpBarWidth * (player.hp / 100), hpBarHeight);
        
        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(player.name.split(' ')[0], player.x, player.y - PLAYER_SIZE - 18);
        
        // Elimination badge
        if (player.eliminations > 0) {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(player.x + 14, player.y - 14, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(player.eliminations.toString(), player.x + 14, player.y - 11);
        }
      });
      
      if (clampedTime < script.duration && !matchEnded) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      pausedTimeRef.current = currentTime;
    };
  }, [isPlaying, matchEnded, script.duration, processEvents, players, zoneRadius, activeEffects, currentTime]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      pausedTimeRef.current = currentTime;
    } else {
      startTimeRef.current = performance.now() - currentTime;
    }
  };
  
  const handleSkip = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    onSkipToResult();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      {/* Header */}
      <div className="flex w-full max-w-3xl items-center justify-between border-b border-fn-gborder pb-3">
        <div className="text-left">
          <p className="fn-label text-fn-green">{playerAName}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-fn-text">HP</span>
            <div className="h-2 w-24 bg-fn-gborder overflow-hidden">
              <div 
                className="h-full bg-fn-green transition-all"
                style={{ width: `${players.find(p => p.id === 'a')?.hp || 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="fn-label">MATCH TIME</p>
          <p className="font-mono text-xl font-bold text-fn-muted">
            {(currentTime / 1000).toFixed(1)}s
          </p>
        </div>
        <div className="text-right">
          <p className="fn-label text-[#ff4d4d]">{playerBName}</p>
          <div className="flex items-center gap-2 justify-end">
            <div className="h-2 w-24 bg-fn-gborder overflow-hidden">
              <div 
                className="h-full bg-[#ff4d4d] transition-all"
                style={{ width: `${players.find(p => p.id === 'b')?.hp || 100}%` }}
              />
            </div>
            <span className="text-2xl font-black text-fn-text">HP</span>
          </div>
        </div>
      </div>
      
      {/* Canvas Arena */}
      <div className="relative overflow-hidden border border-fn-gborder bg-[#0a0f0c]">
        <canvas
          ref={canvasRef}
          width={ARENA_WIDTH}
          height={ARENA_HEIGHT}
          className="block"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {/* Overlay controls */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          <button
            onClick={togglePlayPause}
            className="flex items-center gap-2 border border-fn-gborder bg-fn-card/90 px-4 py-2 text-xs font-black uppercase tracking-widest text-fn-text hover:border-fn-green hover:text-fn-green"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 border border-fn-gborder bg-fn-card/90 px-4 py-2 text-xs font-black uppercase tracking-widest text-fn-text hover:border-fn-green hover:text-fn-green"
          >
            <SkipForward size={14} />
            Skip to Result
          </button>
        </div>
      </div>
      
      {/* Kill Feed */}
      <div className="w-full max-w-3xl border border-fn-gborder bg-fn-card/50 p-3">
        <p className="mb-2 fn-label flex items-center gap-2">
          <Target size={12} className="text-fn-green" />
          COMBAT LOG
        </p>
        <div className="space-y-1">
          <AnimatePresence>
            {killFeed.map((feed) => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-mono text-fn-muted"
              >
                <span className="text-fn-green">⚡</span> {feed.text}
              </motion.div>
            ))}
          </AnimatePresence>
          {killFeed.length === 0 && (
            <p className="text-[10px] font-mono text-fn-muted/50">Waiting for first engagement...</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
