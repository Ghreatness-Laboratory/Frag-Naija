import crypto from 'crypto';

const PAYSTACK_BASE   = 'https://api.paystack.co';

/**
 * Initialize a Paystack transaction.
 * Amount should be in NGN (naira) — we convert to kobo here.
 */
export async function initializeTransaction({ email, amount, metadata, reference }) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount:       Math.round(amount * 100), // NGN → kobo
      metadata,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wager?status=success`,
    }),
  });
  return res.json();
}

/**
 * Verify a transaction by reference (for manual checks).
 */
export async function verifyTransaction(reference) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  return res.json();
}

/**
 * Verify webhook HMAC-SHA512 signature.
 * rawBody must be the raw Buffer/string from the request.
 */
export function verifyWebhookSignature(rawBody, signature) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

/**
 * Generate a unique Paystack transaction reference.
 */
export function generateReference(prefix = 'FN') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}
