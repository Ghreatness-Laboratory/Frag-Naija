import Groq from 'groq-sdk';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

let _client = null;
function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

/**
 * @param {{ role: 'system'|'user'|'assistant', content: string }[]} messages
 * @param {{ model?: string, temperature?: number, maxTokens?: number }} [opts]
 * @returns {Promise<string>}
 */
export async function groqChat(messages, opts = {}) {
  const completion = await getClient().chat.completions.create({
    model: opts.model ?? GROQ_MODEL,
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1024,
  });
  return completion.choices[0]?.message?.content?.trim() ?? '';
}
