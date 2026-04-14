const ADMIN_SESSION_COOKIE = 'admin_auth';
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

const textEncoder = new TextEncoder();

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;

  if (!secret) {
    throw new Error('Missing admin session secret. Set ADMIN_SESSION_SECRET or ADMIN_PASSWORD.');
  }

  return secret;
}

function getCryptoProvider() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is not available in this runtime.');
  }

  return globalThis.crypto;
}

function bytesToBase64Url(bytes) {
  let base64;

  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    base64 = btoa(binary);
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'));
  }

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function importSigningKey() {
  return getCryptoProvider().subtle.importKey(
    'raw',
    textEncoder.encode(getAdminSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function signValue(value) {
  const key = await importSigningKey();
  const signature = await getCryptoProvider().subtle.sign('HMAC', key, textEncoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function decodePayload(encodedPayload) {
  const decoded = new TextDecoder().decode(base64UrlToBytes(encodedPayload));
  return safeJsonParse(decoded);
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}

export function getAdminSessionMaxAge() {
  return ADMIN_SESSION_TTL_SECONDS;
}

export async function createAdminSessionToken() {
  const payload = {
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
  };

  const encodedPayload = bytesToBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionToken(token) {
  if (!token) {
    return false;
  }

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = await signValue(encodedPayload);
  if (providedSignature !== expectedSignature) {
    return false;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload || payload.role !== 'admin' || typeof payload.exp !== 'number') {
    return false;
  }

  return payload.exp > Math.floor(Date.now() / 1000);
}
