'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid password');
      router.push('/admin');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fn-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-fn-green/10 border border-fn-green/30 mb-4">
            <Shield className="w-7 h-7 text-fn-green" />
          </div>
          <h1 className="text-2xl font-bold text-fn-text font-mono tracking-widest uppercase">Admin</h1>
          <p className="text-fn-muted text-sm mt-1">Frag Naija Control Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-fn-card border border-fn-gborder rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fn-muted" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-fn-dark border border-fn-gborder rounded pl-10 pr-10 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fn-muted hover:text-fn-text"
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
            {loading ? 'Authenticating...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
