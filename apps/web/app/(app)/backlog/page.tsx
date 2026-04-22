'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'chip-error',
  medium: 'chip-warning',
  low: 'chip',
};

export default function BacklogPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      loadBacklog();
    }
  }, [user]);

  const loadBacklog = async () => {
    setLoadingData(true);
    try {
      const data = await api.backlog.list();
      setItems(data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const promoteToToday = async (id: string) => {
    try {
      await api.dailyItems.promote(id);
      window.location.href = '/today';
    } catch (error) {
      console.error('Failed to promote:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body-sm text-muted">Loading...</p>
      </div>
    );
  }

  const pendingItems = items.filter(i => i.status === 'pending');

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading">Backlog</h1>
          <p className="text-body-sm text-tertiary mt-1">
            {pendingItems.length} pending item{pendingItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Item
        </button>
      </div>

      {/* List */}
      {loadingData ? (
        <div className="empty-state">
          <p className="text-body-sm text-muted">Loading...</p>
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="12" y1="8" x2="12" y2="16" />
          </svg>
          <p className="empty-state-title mt-4">No pending items</p>
          <p className="empty-state-description">
            Add items to your backlog to tackle later
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingItems.map(item => (
            <div key={item.id} className="card-hover p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-body font-medium text-primary">{item.title}</h3>
                  {item.description && (
                    <p className="text-body-sm text-secondary mt-1">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    {item.priority && (
                      <span className={PRIORITY_STYLES[item.priority] || 'chip'}>
                        {item.priority}
                      </span>
                    )}
                    {item.energyLevel && (
                      <span className="chip">
                        Energy {item.energyLevel}/5
                      </span>
                    )}
                    {item.estimatedMinutes && (
                      <span className="chip">
                        {item.estimatedMinutes}min
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => promoteToToday(item.id)}
                  className="btn-secondary btn-sm flex-shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  </svg>
                  Promote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}