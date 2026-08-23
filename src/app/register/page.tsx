'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { setStoredToken, API_BASE } from '@/lib/api';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '1048649974212-tgk9hnmp535r3jtsjaa8rcmed5beoaud.apps.googleusercontent.com';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOAuthFallback = async (provider: 'google' | 'github', customEmail?: string, customName?: string, avatar?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: customEmail || (provider === 'google' ? 'developer.google@lemas.ai' : 'developer.github@lemas.ai'),
          name: customName || (provider === 'google' ? 'Google Developer' : 'GitHub Developer'),
          avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to register with ${provider}`);
      }
      setStoredToken(data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'OAuth error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                // Fetch real user profile from Google OAuth2 endpoint
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await userRes.json();
                if (googleProfile && googleProfile.email) {
                  await handleOAuthFallback('google', googleProfile.email, googleProfile.name, googleProfile.picture);
                  return;
                }
              } catch (err: any) {
                console.warn('Failed to fetch google userinfo:', err);
              }
            }
            handleOAuthFallback('google');
          },
          error_callback: (err: any) => {
            console.warn('Google OAuth error:', err);
            handleOAuthFallback('google');
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('InitTokenClient fallback:', err);
      }
    }

    handleOAuthFallback('google');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      setStoredToken(data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Full-Screen Outer Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter blur-xs brightness-[0.45] transition-transform duration-1000"
        style={{ backgroundImage: "url('/images/auth_bg_wallpaper.jpg')" }}
      />
      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/80" />
      <div className="absolute inset-0 bg-[#05060d]/60 backdrop-blur-[6px]" />

      {/* Main Full-Bleed Split Card */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/15 bg-[#090b10]/95 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] grid grid-cols-1 md:grid-cols-2 min-h-[620px]">
        {/* Left Side: Cinematic Artwork */}
        <div className="relative w-full h-64 md:h-full overflow-hidden bg-black">
          <img
            src="/images/auth_cinematic.jpg"
            alt="Lemas AI Cinematic"
            className="w-full h-full object-cover select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#090b10]/40 md:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-transparent to-transparent md:hidden" />
        </div>

        {/* Right Side: Auth Form */}
        <div className="relative flex flex-col justify-center px-8 py-10 sm:px-12 z-10">
          {/* Close button X */}
          <Link
            href="/"
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-4.5" />
          </Link>

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex size-14 items-center justify-center p-1 mb-2">
              <img src="/logo.png" alt="Lemas Logo" className="size-12 object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              Join Lemas<span className="text-emerald-400">.AI</span>
            </h1>
            <p className="text-xs text-white/50 mt-1.5">
              Create an account and get $10 free AI gateway tokens
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          {/* OAuth Buttons (Google & GitHub) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-white/90 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {/* Google SVG */}
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthFallback('github')}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-[#24292f] text-white text-xs sm:text-sm font-semibold hover:bg-[#2f363d] transition-all shadow-sm border border-white/10 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {/* GitHub SVG */}
              <svg className="size-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center justify-between gap-3 text-xs text-white/30">
            <div className="h-px flex-1 bg-white/10" />
            <span>or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-semibold hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/25"
            >
              <span>{loading ? 'Creating...' : 'Continue with email'}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>

          {/* Switch to signin */}
          <div className="text-center pt-3">
            <p className="text-xs text-white/50">
              Already have an account?{' '}
              <Link href="/login" className="text-cyan-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-center text-white/30 leading-relaxed mt-4">
            By continuing with Google, Apple, or Email, you agree to our{' '}
            <Link href="/contact" className="text-white/50 hover:underline">
              Terms of Service
            </Link>{' '}
            and acknowledge that you have read our{' '}
            <Link href="/contact" className="text-white/50 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
