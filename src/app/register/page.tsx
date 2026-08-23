'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { setStoredToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
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
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/15 bg-[#090b10]/95 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] grid grid-cols-1 md:grid-cols-2 min-h-[580px]">
        {/* Left Side: Cinematic Anime Artwork */}
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

          {/* Heading in elegant styling */}
          <div className="text-center mb-6">
            <div className="inline-flex size-14 items-center justify-center p-1 mb-2">
              <img src="/logo.png" alt="Lemas Logo" className="size-12 object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              Welcome to Lemas<span className="text-emerald-400">.AI</span>
            </h1>
            <p className="text-xs text-white/50 mt-1.5">
              Next-Gen AI Gateway & Multi-Model Orchestration
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setName('Google Developer');
                setEmail('developer@gmail.com');
                setPassword('password123');
              }}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-white/90 transition-all shadow-sm active:scale-[0.99]"
            >
              {/* Google SVG */}
              <svg className="size-4" viewBox="0 0 24 24">
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
              onClick={() => {
                setName('Apple User');
                setEmail('developer@icloud.com');
                setPassword('password123');
              }}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-white/90 transition-all shadow-sm active:scale-[0.99]"
            >
              {/* Apple SVG */}
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.87-.9.04-1.99.6-2.63 1.35-.56.65-1.06 1.71-.93 2.74 1.01.08 2.02-.47 2.64-1.22z" />
              </svg>
              <span>Continue with Apple</span>
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
