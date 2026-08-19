'use client';

import { Bot, Send, X } from 'lucide-react';
import { useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi! I can help with FragNaija navigation, games, rankings, Fantasy League, Wager Zone, wallet basics, and account support. Chats may be logged for quality review.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      {open && <section className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-3 z-[260] flex h-[520px] max-h-[72dvh] w-[min(92vw,360px)] flex-col border border-fn-green/40 bg-fn-card shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between border-b border-fn-gborder bg-fn-dark px-3 py-2"><span className="fn-label text-fn-green">FragNaija Support</span><button onClick={() => setOpen(false)} className="text-fn-muted hover:text-fn-text"><X size={16} /></button></div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3 text-xs">
          {messages.map((m, i) => <div key={i} className={`max-w-[86%] border px-3 py-2 ${m.role === 'user' ? 'ml-auto border-fn-green/30 bg-fn-green/10 text-fn-text' : 'border-fn-gborder bg-fn-black/70 text-fn-muted'}`}>{m.content}</div>)}
          {loading && <p className="fn-label text-fn-green">Typing...</p>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-fn-gborder p-2"><input value={input} onChange={(e) => setInput(e.target.value)} className="min-w-0 flex-1 border border-fn-gborder bg-fn-black px-3 py-2 text-xs outline-none focus:border-fn-green" placeholder="Ask FragNaija support" /><button className="bg-fn-green px-3 text-fn-black"><Send size={15} /></button></form>
      </section>}
      <button onClick={() => setOpen((v) => !v)} className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-3 z-[250] flex h-14 w-14 items-center justify-center rounded-full bg-fn-green text-fn-black shadow-[0_0_28px_rgba(77,255,110,.35)] ring-4 ring-fn-black/80" aria-label="Open support chat"><Bot size={26} /></button>
    </>
  );
}
