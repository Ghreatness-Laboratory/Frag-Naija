'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Fetch directly from the live Django backend
      const res = await fetch('https://frag-naija-backend.onrender.com/api/token/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username, // Django's SimpleJWT expects 'username'
          password: password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Django returns 'detail' for auth errors
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      // ✅ SUCCESS: Save the JWT tokens in localStorage
      // This is what the hooks.js file looks for to authorize future requests!
      localStorage.setItem('django_access_token', data.access);
      localStorage.setItem('django_refresh_token', data.refresh);

      // Redirect to homepage
      window.location.href = '/';
      
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
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
            <LogIn className="w-7 h-7 text-fn-green" />
          </div>
          <h1 className="text-2xl font-bold text-fn-text font-mono tracking-widest uppercase">
            Sign In
          </h1>
          <p className="text-fn-muted text-sm mt-1">
            Welcome back, soldier
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-fn-card border border-fn-gborder rounded-lg p-6 space-y-4">
          
          {/* Username / Email */}
          <div>
            <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fn-muted" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-fn-dark border border-fn-gborder rounded pl-10 pr-4 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                placeholder="Enter your username"
                required
                autoComplete="username"
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

          {/* Error Message */}
          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Register Link */}
          <p className="text-center text-fn-muted text-xs">
            No account?{' '}
            <Link href="/register" className="text-fn-green hover:text-fn-gdim transition-colors font-bold uppercase tracking-wider">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
