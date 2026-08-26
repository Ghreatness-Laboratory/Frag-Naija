'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

type Step = 'credentials' | '2fa';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export default function LoginPage() {
  const nextPath = typeof window === 'undefined' ? '/' : safeNextPath(new URLSearchParams(window.location.search).get('next'));
  const [step, setStep]         = useState<Step>('credentials');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // 2FA state
  const [factorId, setFactorId] = useState('');
  const [totpCode, setTotpCode] = useState('');

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Check if user has 2FA enabled
      if (data.totp_enabled && data.factors?.length) {
        setFactorId(data.factors[0].id);
        setStep('2fa');
      } else {
        window.location.href = nextPath;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/2fa/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ factorId, code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '2FA verification failed');
      window.location.href = nextPath;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '2FA failed');
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fn-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 mb-6">
            <span className="font-display text-2xl font-black text-fn-green tracking-widest glow-text">FRAG</span>
            <span className="font-display text-2xl font-black text-fn-text tracking-widest">NAIJA</span>
          </Link>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-fn-green/10 border border-fn-green/30 mb-4">
            {step === '2fa'
              ? <ShieldCheck className="w-7 h-7 text-fn-green" />
              : <LogIn className="w-7 h-7 text-fn-green" />
            }
          </div>
          <h1 className="text-2xl font-bold text-fn-text font-display tracking-widest uppercase">
            {step === '2fa' ? '2FA Verification' : 'Sign In'}
          </h1>
          <p className="text-fn-muted text-sm mt-1">
            {step === '2fa' ? 'Enter the code from your authenticator app' : 'Welcome back, soldier'}
          </p>
        </div>

        {/* ── 2FA step ── */}
        {step === '2fa' ? (
          <form onSubmit={handle2FA} className="bg-fn-card border border-fn-gborder rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Authenticator Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-fn-dark border border-fn-gborder rounded px-4 py-3 text-fn-text text-xl text-center tracking-[0.5em] font-mono focus:outline-none focus:border-fn-green transition-colors"
                placeholder="000000"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(''); setTotpCode(''); }}
              className="w-full text-fn-muted text-xs uppercase tracking-widest hover:text-fn-text transition-colors"
            >
              ← Back to login
            </button>
          </form>
        ) : (
          /* ── Credentials step ── */
          <form onSubmit={handleCredentials} className="bg-fn-card border border-fn-gborder rounded-lg p-6 space-y-4">
            <SocialAuthButtons />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-fn-gborder" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-fn-card text-fn-muted uppercase tracking-widest">or</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fn-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-fn-dark border border-fn-gborder rounded pl-10 pr-4 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fn-muted" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-fn-dark border border-fn-gborder rounded pl-10 pr-10 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fn-muted hover:text-fn-text"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-fn-muted text-xs">
              Don&apos;t have an account? <Link href="/register" className="font-bold text-fn-green hover:text-fn-gdim">Sign Up</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
