import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE   = 'https://api.paystack.co';

/**
 * Initialize a Paystack transaction.
 * Amount should be in NGN (naira) — we convert to kobo here.
 */
export async function initializeTransaction({ email, amount, metadata, reference, callback_url }) {
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
      callback_url: callback_url ?? `${process.env.NEXT_PUBLIC_SITE_URL}/wager?status=success`,
    }),
  });
  return res.json();
}

/**
 * Verify a transaction by reference (for manual checks).
 */
export async function verifyTransaction(reference) {
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

/**
 * Fetch the list of Nigerian banks from Paystack.
 */
export async function getBanks() {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetch(`${PAYSTACK_BASE}/bank?country=nigeria&currency=NGN&perPage=200`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  return res.json();
}

/**
 * Verify a bank account number via Paystack.
 */
export async function resolveAccountNumber(account_number, bank_code) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetch(
    `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(account_number)}&bank_code=${encodeURIComponent(bank_code)}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );
  return res.json();
}

/**
 * Create a Paystack transfer recipient (NUBAN bank account).
 */
export async function createTransferRecipient({ name, account_number, bank_code }) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'nuban', name, account_number, bank_code, currency: 'NGN' }),
  });
  return res.json();
}

/**
 * Initiate a Paystack transfer to a recipient.
 * Amount is in NGN — converted to kobo here.
 */
export async function initiateTransfer({ amount, recipient_code, reference, reason }) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  const res = await fetch(`${PAYSTACK_BASE}/transfer`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source:    'balance',
      amount:    Math.round(amount * 100), // NGN → kobo
      recipient: recipient_code,
      reference,
      reason,
    }),
  });
  return res.json();
}
