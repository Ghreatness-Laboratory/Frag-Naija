'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Trophy } from 'lucide-react';

const SIGNAL_GREEN = '#4dff6e';
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 500;
const PLAYER_RADIUS = 12;
const TEAM_A_COLOR = SIGNAL_GREEN;
const TEAM_B_COLOR = '#ff4d4d';

export type MatchEvent = {
  time: number;
  event_type: 'spawn' | 'movement' | 'engagement' | 'elimination' | 'match_end';
  actor: string;
  target?: string;
  position?: { x: number; y: number };
  team: 'a' | 'b';
};

export type MatchScript = {
  winner: 'a' | 'b';
  finalScore: { a: number; b: number };
  events: MatchEvent[];
  duration: number;
};

export type PlayerDot = {
  id: string;
  team: 'a' | 'b';
  name: string;
  x: number;
  y: number;
  alive: boolean;
  eliminations: number;
};

interface MatchSimViewerProps {
  teamAName: string;
  teamBName: string;
  teamARoster: Array<{ id: string; name: string }>;
  teamBRoster: Array<{ id: string; name: string }>;
  onMatchEnd: (result: { winner: 'a' | 'b'; score: { a: number; b: number }; mvp?: PlayerDot }) => void;
  onSkipToResult: () => void;
}

function generateMatchScript(
  teamAName: string,
  teamBName: string,
  teamARoster: Array<{ id: string; name: string }>,
  teamBRoster: Array<{ id: string; name: string }>
): MatchScript {
  // Predetermine winner (slightly favor team A for demo, could be randomized server-side)
  const winner = Math.random() > 0.5 ? 'a' : 'b';
  const winningKills = 16 + Math.floor(Math.random() * 8); // 16-23 kills
  const losingKills = 8 + Math.floor(Math.random() * (winningKills - 10)); // Less than winner
  
  const finalScore = winner === 'a' 
    ? { a: winningKills, b: losingKills }
    : { a: losingKills, b: winningKills };
  
  const events: MatchEvent[] = [];
  const duration = 45000; // 45 seconds playback
  
  // Spawn events at start
  teamARoster.forEach((player, i) => {
    events.push({
      time: 0,
      event_type: 'spawn',
      actor: player.id,
      team: 'a',
      position: { x: 100 + i * 40, y: 150 + i * 30 }
    });
  });
  
  teamBRoster.forEach((player, i) => {
    events.push({
      time: 0,
      event_type: 'spawn',
      actor: player.id,
      team: 'b',
      position: { x: ARENA_WIDTH - 100 - i * 40, y: 150 + i * 30 }
    });
  });
  
  // Generate elimination events spread across timeline
  const totalEliminations = finalScore.a + finalScore.b;
  let currentTime = 2000; // Start after spawns
  const timeStep = (duration - 5000) / totalEliminations;
  
  let killsA = 0;
  let killsB = 0;
  
  for (let i = 0; i < totalEliminations; i++) {
    const isTeamAKill = i < finalScore.a;
    const killer = isTeamAKill 
      ? teamARoster[Math.floor(Math.random() * teamARoster.length)]
      : teamBRoster[Math.floor(Math.random() * teamBRoster.length)];
    
    const victim = isTeamAKill
      ? teamBRoster.find(p => p.id !== teamBRoster[i % teamBRoster.length]?.id) || teamBRoster[0]
      : teamARoster.find(p => p.id !== teamARoster[i % teamARoster.length]?.id) || teamARoster[0];
    
    currentTime += timeStep * (0.7 + Math.random() * 0.6);
    
    events.push({
      time: Math.min(currentTime, duration - 2000),
      event_type: 'elimination',
      actor: killer.id,
      target: victim.id,
      team: isTeamAKill ? 'a' : 'b',
      position: { 
        x: ARENA_WIDTH / 2 + (Math.random() - 0.5) * 300, 
        y: ARENA_HEIGHT / 2 + (Math.random() - 0.5) * 200 
      }
    });
    
    if (isTeamAKill) killsA++; else killsB++;
  }
  
  // Match end event
  events.push({
    time: duration,
    event_type: 'match_end',
    actor: '',
    team: winner
  });
  
  // Sort by time
  events.sort((a, b) => a.time - b.time);
  
  return { winner, finalScore, events, duration };
}

export function MatchSimViewer({
  teamAName,
  teamBName,
  teamARoster,
  teamBRoster,
  onMatchEnd,
  onSkipToResult
}: MatchSimViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [script] = useState<MatchScript>(() => 
    generateMatchScript(teamAName, teamBName, teamARoster, teamBRoster)
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [score, setScore] = useState({ a: 0, b: 0 });
  const [killFeed, setKillFeed] = useState<Array<{ id: number; text: string }>>([]);
  const [players, setPlayers] = useState<PlayerDot[]>([]);
  const [matchEnded, setMatchEnded] = useState(false);
  
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const killFeedIdRef = useRef(0);
  
  // Initialize players from spawn events
  useEffect(() => {
    const spawnEvents = script.events.filter(e => e.event_type === 'spawn');
    const initialPlayers: PlayerDot[] = [];
    
    spawnEvents.forEach(event => {
      const roster = event.team === 'a' ? teamARoster : teamBRoster;
      const playerData = roster.find(p => p.id === event.actor);
      if (playerData && event.position) {
        initialPlayers.push({
          id: event.actor,
          team: event.team,
          name: playerData.name,
          x: event.position.x,
          y: event.position.y,
          alive: true,
          eliminations: 0
        });
      }
    });
    
    setPlayers(initialPlayers);
  }, [script.events, teamARoster, teamBRoster]);
  
  // Process events up to current time
  const processEvents = useCallback((time: number) => {
    const relevantEvents = script.events.filter(e => e.time <= time);
    
    let newScore = { a: 0, b: 0 };
    const newPlayers = [...players];
    const newKillFeed: Array<{ id: number; text: string }> = [];
    
    relevantEvents.forEach(event => {
      if (event.event_type === 'elimination') {
        const killerTeam = event.team;
        if (killerTeam === 'a') newScore.a++; else newScore.b++;
        
        // Update player eliminations
        const killerIndex = newPlayers.findIndex(p => p.id === event.actor);
        if (killerIndex >= 0) {
          newPlayers[killerIndex] = { ...newPlayers[killerIndex], eliminations: newPlayers[killerIndex].eliminations + 1 };
        }
        
        // Mark victim as dead (temporarily for visualization)
        const victimIndex = newPlayers.findIndex(p => p.id === event.target);
        if (victimIndex >= 0) {
          newPlayers[victimIndex] = { ...newPlayers[victimIndex], alive: false };
        }
        
        // Add to kill feed
        const killerName = event.team === 'a' 
          ? teamARoster.find(p => p.id === event.actor)?.name || 'Unknown'
          : teamBRoster.find(p => p.id === event.actor)?.name || 'Unknown';
        const victimName = event.team === 'a'
          ? teamBRoster.find(p => p.id === event.target)?.name || 'Unknown'
          : teamARoster.find(p => p.id === event.target)?.name || 'Unknown';
        
        newKillFeed.push({
          id: killFeedIdRef.current++,
          text: `${killerName} eliminated ${victimName}`
        });
        
        // Respawn after delay (simplified - just mark alive again)
        setTimeout(() => {
          setPlayers(prev => prev.map(p => 
            p.id === event.target ? { ...p, alive: true, x: event.team === 'a' ? 100 : ARENA_WIDTH - 100, y: 250 } : p
          ));
        }, 2000);
      }
    });
    
    setScore(newScore);
    setPlayers(newPlayers);
    if (newKillFeed.length > 0) {
      setKillFeed(prev => [...newKillFeed.slice(-5), ...prev].slice(0, 8));
    }
    
    // Check for match end
    if (time >= script.duration && !matchEnded) {
      setMatchEnded(true);
      const mvp = newPlayers.reduce((best, p) => 
        p.eliminations > best.eliminations ? p : best, newPlayers[0]
      );
      setTimeout(() => {
        onMatchEnd({ winner: script.winner, score: script.finalScore, mvp });
      }, 1000);
    }
  }, [script, players, matchEnded, onMatchEnd, teamARoster, teamBRoster]);
  
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
      
      // Render
      ctx.fillStyle = '#0a0f0c';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      
      // Draw arena grid
      ctx.strokeStyle = 'rgba(77, 255, 110, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < ARENA_WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, ARENA_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < ARENA_HEIGHT; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(ARENA_WIDTH, i);
        ctx.stroke();
      }
      
      // Draw center line
      ctx.strokeStyle = 'rgba(77, 255, 110, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ARENA_WIDTH / 2, 0);
      ctx.lineTo(ARENA_WIDTH / 2, ARENA_HEIGHT);
      ctx.stroke();
      
      // Draw players
      players.forEach(player => {
        if (!player.alive) return;
        
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = player.team === 'a' ? TEAM_A_COLOR : TEAM_B_COLOR;
        ctx.fill();
        
        // Glow effect
        ctx.shadowColor = player.team === 'a' ? TEAM_A_COLOR : TEAM_B_COLOR;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Name label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(player.name.split(' ')[0], player.x, player.y - 18);
        
        // Elimination count badge
        if (player.eliminations > 0) {
          ctx.fillStyle = player.team === 'a' ? '#000000' : '#000000';
          ctx.beginPath();
          ctx.arc(player.x + 10, player.y - 10, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(player.eliminations.toString(), player.x + 10, player.y - 7);
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
  }, [isPlaying, matchEnded, script.duration, processEvents, players, currentTime]);
  
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
          <p className="fn-label text-fn-green">{teamAName}</p>
          <p className="text-2xl font-black text-fn-text">{score.a}</p>
        </div>
        <div className="text-center">
          <p className="fn-label">MATCH TIME</p>
          <p className="font-mono text-xl font-bold text-fn-muted">
            {(currentTime / 1000).toFixed(1)}s
          </p>
        </div>
        <div className="text-right">
          <p className="fn-label text-[#ff4d4d]">{teamBName}</p>
          <p className="text-2xl font-black text-fn-text">{score.b}</p>
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
        <p className="mb-2 fn-label">KILL FEED</p>
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
                <span className="text-fn-green">▶</span> {feed.text}
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
