'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/today');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-display tracking-tight">Vector</h1>
          <p className="text-body-sm text-tertiary mt-2">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Min. 6 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="input-label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="chip-error text-caption px-3 py-2 w-full">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-body-sm text-tertiary mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}