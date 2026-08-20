'use client';

import { Bot, Send, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFloatingIconDismiss } from '@/hooks/useFloatingIconDismiss';

type Message = { role: 'user' | 'assistant'; content: string };

const LONG_PRESS_DURATION = 600; // ms

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi! I can help with FragNaija navigation, games, rankings, Fantasy League, Wager Zone, wallet basics, and account support. Chats may be logged for quality review.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { dismissed, handleDismiss, handleReenable } = useFloatingIconDismiss('chatbot');
  
  // Long-press detection
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);

  const handlePressStart = useCallback(() => {
    isLongPressing.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressing.current = true;
      handleDismiss();
    }, LONG_PRESS_DURATION);
  }, [handleDismiss]);

  const handlePressEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  // Dismiss chatbot (explicit dismiss via context menu)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDismiss();
  };

  // Re-enable chatbot (for session reset)
  const handleReenableClick = () => {
    handleReenable();
  };

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/support-chat', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      setMessages([...next, { role: 'assistant', content: res.ok ? data.message : (data.error || 'Support is unavailable right now.') }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const openSupport = () => { handleReenable(); setOpen(true); };
    window.addEventListener('fn-open-support-chat', openSupport);
    return () => window.removeEventListener('fn-open-support-chat', openSupport);
  }, [handleReenable]);

  // If dismissed and not open, show small re-open tab
  if (dismissed && !open) {
    return (
      <button
        onClick={handleReenableClick}
        className="fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-4 z-[250] flex h-8 w-8 items-center justify-center rounded-full border border-fn-green/40 bg-fn-black/90 text-fn-green opacity-70 transition-opacity hover:opacity-100"
        aria-label="Re-enable support chat"
        title="Re-enable support chat"
      >
        <Bot size={14} />
      </button>
    );
  }

  return (
    <>
      {open && <section className="fixed bottom-[calc(13.5rem+env(safe-area-inset-bottom))] right-4 z-[260] flex h-[520px] max-h-[72dvh] w-[min(92vw,360px)] flex-col border border-fn-green/40 bg-fn-card shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between border-b border-fn-gborder bg-fn-dark px-3 py-2"><span className="fn-label text-fn-green">FragNaija Support</span><button onClick={() => setOpen(false)} className="text-fn-muted hover:text-fn-text"><X size={16} /></button></div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3 text-xs">
          {messages.map((m, i) => <div key={i} className={`max-w-[86%] border px-3 py-2 ${m.role === 'user' ? 'ml-auto border-fn-green/30 bg-fn-green/10 text-fn-text' : 'border-fn-gborder bg-fn-black/70 text-fn-muted'}`}>{m.content}</div>)}
          {loading && <p className="fn-label text-fn-green">Typing...</p>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-fn-gborder p-2"><input value={input} onChange={(e) => setInput(e.target.value)} className="min-w-0 flex-1 border border-fn-gborder bg-fn-black px-3 py-2 text-xs outline-none focus:border-fn-green" placeholder="Ask FragNaija support" /><button className="bg-fn-green px-3 text-fn-black"><Send size={15} /></button></form>
      </section>}
      {/* Chatbot FAB - positioned above bottom nav with clear spacing */}
      <button 
        onClick={() => setOpen((v) => !v)} 
        onContextMenu={handleContextMenu}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
        className="fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-4 z-[250] flex h-14 w-14 items-center justify-center rounded-full bg-fn-green text-fn-black shadow-[0_0_28px_rgba(77,255,110,.35)] ring-4 ring-fn-black/80 group touch-none" 
        aria-label="Open support chat"
        title="Long-press or right-click to dismiss"
      >
        <Bot size={26} />
        {/* Long-press hint appears on hover */}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fn-black/90 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-fn-green opacity-0 transition-opacity group-hover:opacity-100">
          Long-press to dismiss
        </span>
      </button>
    </>
  );
}
