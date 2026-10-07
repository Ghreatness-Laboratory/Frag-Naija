import { createClient } from '@supabase/supabase-js';

let client = null;

function normalizeSupabaseJwtKey(value, envName) {
  const rawKey = String(value ?? '').trim();
  const bearerMatch = rawKey.match(/^Bearer\s+(.+)$/i);
  const unprefixedKey = bearerMatch ? bearerMatch[1].trim() : rawKey;
  const unquotedKey = unprefixedKey.replace(/^(["'])(.*)\1$/, '$2').trim();

  if (!unquotedKey) {
    throw new Error(`Missing Supabase admin environment variable: ${envName}.`);
  }

  if (unquotedKey.split('.').length !== 3) {
    throw new Error(
      `${envName} must be a raw Supabase JWT with three dot-separated segments. ` +
        'Remove any Bearer prefix, JSON wrapping, or copied connection string value.'
    );
  }

  return unquotedKey;
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = normalizeSupabaseJwtKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_SERVICE_ROLE_KEY'
  );

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase admin environment variable: NEXT_PUBLIC_SUPABASE_URL.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getAdminClient() {
  if (!client) {
    client = createAdminClient();
  }

  return client;
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      return getAdminClient()[prop];
    },
  }
);
