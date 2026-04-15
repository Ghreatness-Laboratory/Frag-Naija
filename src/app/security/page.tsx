'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ShieldOff, Shield, Copy, Check, ArrowLeft } from 'lucide-react';

type Factor = { id: string; status: string };
type UserData = {
  email: string;
  username?: string;
  provider?: string;
  totp_enabled: boolean;
  factors: Factor[];
} | null;

type EnrollData = { factorId: string; qrCode: string; secret: string } | null;
type EnrollStep = 'idle' | 'scan' | 'confirm' | 'done';

export default function SecurityPage() {
  const [user, setUser]           = useState<UserData>(null);
  const [loading, setLoading]     = useState(true);
  const [enrollStep, setEnrollStep] = useState<EnrollStep>('idle');
  const [enrollData, setEnrollData] = useState<EnrollData>(null);
  const [code, setCode]           = useState('');
  const [error, setError]         = useState('');
  const [busy, setBusy]           = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setUser(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function startEnroll() {
    setBusy(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/2fa/enroll', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnrollData({ factorId: data.factorId, qrCode: data.qrCode, secret: data.secret });
      setEnrollStep('scan');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start enrollment');
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollData) return;
    setBusy(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/2fa/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ factorId: enrollData.factorId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnrollStep('done');
      setUser(prev => prev ? { ...prev, totp_enabled: true } : prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid code');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function disable2FA() {
    if (!user?.factors?.length) return;
    if (!confirm('Disable 2FA? Your account will be less secure.')) return;
    setBusy(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/2fa/unenroll', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ factorId: user.factors[0].id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(prev => prev ? { ...prev, totp_enabled: false, factors: [] } : prev);
      setEnrollStep('idle');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to disable 2FA');
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!enrollData?.secret) return;
    navigator.clipboard.writeText(enrollData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fn-black flex items-center justify-center">
        <div className="text-fn-muted text-sm uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-fn-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-fn-muted text-sm">You must be logged in to manage security settings.</p>
          <Link href="/login" className="fn-btn text-xs px-4 py-2">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fn-black pt-20 pb-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-fn-muted text-xs uppercase tracking-widest hover:text-fn-green transition-colors">
          <ArrowLeft size={12} /> Back
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-fn-text font-mono tracking-widest uppercase flex items-center gap-3">
            <Shield className="text-fn-green" size={22} /> Account Security
          </h1>
          <p className="text-fn-muted text-sm mt-1">{user.email}</p>
        </div>

        {/* Auth provider info */}
        <div className="bg-fn-card border border-fn-gborder rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-fn-muted text-xs uppercase tracking-widest mb-1">Sign-in method</p>
            <p className="text-fn-text text-sm font-bold capitalize">{user.provider ?? 'Email / Password'}</p>
          </div>
          {user.provider === 'google' && (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
        </div>

        {/* 2FA card */}
        <div className="bg-fn-card border border-fn-gborder rounded-lg p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                {user.totp_enabled
                  ? <><ShieldCheck size={15} className="text-fn-green" /> Two-Factor Auth — Active</>
                  : <><ShieldOff size={15} className="text-fn-muted" /> Two-Factor Auth — Off</>
                }
              </h2>
              <p className="text-fn-muted text-xs mt-1">
                {user.totp_enabled
                  ? 'Your account is protected with an authenticator app.'
                  : 'Add an extra layer of security to your account.'}
              </p>
            </div>
            {user.totp_enabled && enrollStep === 'idle' && (
              <span className="text-[10px] bg-fn-green/10 text-fn-green border border-fn-green/30 px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                Enabled
              </span>
            )}
          </div>

          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>
          )}

          {/* ── idle: not enrolled ── */}
          {!user.totp_enabled && enrollStep === 'idle' && (
            <button
              onClick={startEnroll}
              disabled={busy}
              className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
            >
              {busy ? 'Setting up...' : 'Enable 2FA'}
            </button>
          )}

          {/* ── scan QR ── */}
          {enrollStep === 'scan' && enrollData && (
            <div className="space-y-4">
              <p className="text-fn-muted text-xs leading-relaxed">
                Scan this QR code with <strong className="text-fn-text">Google Authenticator</strong>, <strong className="text-fn-text">Authy</strong>, or any TOTP app. Then enter the 6-digit code below to confirm.
              </p>

              <div className="flex justify-center bg-white rounded-lg p-3">
                <Image src={enrollData.qrCode} alt="2FA QR Code" width={180} height={180} unoptimized />
              </div>

              {/* Manual secret */}
              <div className="bg-fn-dark border border-fn-gborder rounded p-3">
                <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Can't scan? Enter this key manually:</p>
                <div className="flex items-center gap-2">
                  <code className="text-fn-green text-xs font-mono flex-1 break-all">{enrollData.secret}</code>
                  <button onClick={copySecret} className="text-fn-muted hover:text-fn-green transition-colors shrink-0">
                    {copied ? <Check size={14} className="text-fn-green" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setEnrollStep('confirm')}
                className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors"
              >
                I've scanned it →
              </button>
            </div>
          )}

          {/* ── confirm code ── */}
          {enrollStep === 'confirm' && enrollData && (
            <form onSubmit={confirmEnroll} className="space-y-4">
              <p className="text-fn-muted text-xs">Enter the 6-digit code from your authenticator app to activate 2FA.</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-fn-dark border border-fn-gborder rounded px-4 py-3 text-fn-text text-xl text-center tracking-[0.5em] font-mono focus:outline-none focus:border-fn-green transition-colors"
                placeholder="000000"
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEnrollStep('scan')}
                  className="flex-1 fn-btn-outline text-xs py-2.5"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="flex-1 bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
                >
                  {busy ? 'Verifying...' : 'Activate 2FA'}
                </button>
              </div>
            </form>
          )}

          {/* ── done ── */}
          {enrollStep === 'done' && (
            <div className="text-center space-y-2 py-2">
              <ShieldCheck size={32} className="text-fn-green mx-auto" />
              <p className="text-fn-green font-bold text-sm uppercase tracking-widest">2FA Activated!</p>
              <p className="text-fn-muted text-xs">Your account is now protected. You'll be asked for a code on every login.</p>
            </div>
          )}

          {/* ── disable ── */}
          {user.totp_enabled && enrollStep === 'idle' && (
            <button
              onClick={disable2FA}
              disabled={busy}
              className="w-full border border-fn-red/30 text-fn-red text-xs font-bold py-2 rounded uppercase tracking-widest hover:bg-fn-red/10 transition-colors disabled:opacity-50"
            >
              {busy ? 'Disabling...' : 'Disable 2FA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
