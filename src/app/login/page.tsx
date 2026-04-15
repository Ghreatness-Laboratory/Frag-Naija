'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

type Step = 'credentials' | '2fa';

export default function LoginPage() {
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
        window.location.href = '/';
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
      window.location.href = '/';
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
          <h1 className="text-2xl font-bold text-fn-text font-mono tracking-widest uppercase">
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
            {/* Google */}
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 w-full border border-fn-gborder rounded py-2.5 text-fn-text text-sm font-bold hover:border-fn-green/50 hover:bg-fn-green/5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>

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
              No account?{' '}
              <Link href="/register" className="text-fn-green hover:text-fn-gdim transition-colors font-bold uppercase tracking-wider">
                Create one
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
