'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Fetch directly from the live Django backend
      const res = await fetch('https://frag-naija-backend.onrender.com/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Invalid admin credentials');
      }

      // Save Django JWT tokens
      localStorage.setItem('django_access_token', data.access);
      localStorage.setItem('django_refresh_token', data.refresh);
      
      // Redirect to the frontend admin dashboard
      router.push('/admin');
      
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fn-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-fn-card border border-fn-gborder rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-fn-text font-mono tracking-widest uppercase text-center mb-6">
          Admin Access
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fn-muted" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-fn-dark border border-fn-gborder rounded pl-10 pr-4 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                placeholder="admin_username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fn-muted" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-fn-dark border border-fn-gborder rounded pl-10 pr-4 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                placeholder="••••••••"
                required
              />
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
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
