import { createClient } from '@supabase/supabase-js';

// Lazy singleton — created on first access so build-time static analysis
// doesn't throw when env vars aren't present in CI / the Next.js build step.
let _client = null;

function getAdminClient() {
  if (_client) return _client;

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Check SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  _client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });

  return _client;
}

// Proxy so existing code can still do `supabaseAdmin.from(...)` etc.
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      return getAdminClient()[prop];
    },
  }
);
