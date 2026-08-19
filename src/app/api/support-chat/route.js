import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getSetting } from '@/features/settings/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

const FALLBACK_PROMPT = "You are FragNaija Support. Keep answers focused on FragNaija platform help and avoid financial or betting advice.";

function normalizeMessages(messages) {
  return Array.isArray(messages)
    ? messages.slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content ?? '').slice(0, 1200) })).filter((m) => m.content.trim())
    : [];
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const messages = normalizeMessages(body.messages);
    if (!messages.length) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const systemPrompt = String(await getSetting('support_chatbot_prompt') || FALLBACK_PROMPT);
    const provider = process.env.SUPPORT_CHATBOT_PROVIDER || 'generic';
    const endpoint = process.env.SUPPORT_CHATBOT_ENDPOINT;
    const apiKey = process.env.SUPPORT_CHATBOT_API_KEY;
    const model = process.env.SUPPORT_CHATBOT_MODEL || 'support-chatbot';

    let answer = '';
    if (endpoint && apiKey) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, ...messages], temperature: 0.2 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || data.message || 'Support provider failed');
      answer = String(data.choices?.[0]?.message?.content || data.message?.content || data.content?.[0]?.text || '').trim();
    }

    if (!answer) {
      answer = "Support chat is configured for FragNaija platform help. I can help with navigation, games, rankings, Fantasy League, Wager Zone, wallet basics, and account support. Provider credentials are not configured yet, so a human-readable AI response is temporarily unavailable.";
    }

    await supabaseAdmin.from('support_chat_logs').insert([{ user_id: user?.id ?? null, provider, messages, response: answer }]);
    return NextResponse.json({ message: answer });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
