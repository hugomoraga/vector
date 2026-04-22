'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push(user ? '/today' : '/login');
    }
  }, [user, loading, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <h1 className="text-display tracking-tight">Vector</h1>
        <p className="text-body-sm text-tertiary mt-2">Loading...</p>
      </div>
    </main>
  );
}