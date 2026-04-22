'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { getTodayDateString } from '@vector/utils';

const SLOT_CONFIG = {
  morning: {
    label: 'Morning',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  afternoon: {
    label: 'Afternoon',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  evening: {
    label: 'Evening',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
} as const;

const STATUS_STYLES: Record<string, string> = {
  pending: 'chip',
  done: 'chip-success',
  skipped: 'chip-warning',
  rescheduled: 'chip-error',
};

export default function TodayPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const date = getTodayDateString();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const data = await api.dailyItems.list(date);
      setItems(data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.dailyItems.update(id, status);
      setItems(items.map(item => item.id === id ? { ...item, status } : item));
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body-sm text-muted">Loading...</p>
      </div>
    );
  }

  const grouped = items.reduce((acc, item) => {
    acc[item.slot] = acc[item.slot] || [];
    acc[item.slot].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const completedCount = items.filter(i => i.status === 'done').length;

  return (
    <>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-primary sm:text-heading">Today</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-body-sm text-tertiary">{date}</p>
          {items.length > 0 && (
            <>
              <span className="text-muted">·</span>
              <p className="text-body-sm text-tertiary">
                {completedCount}/{items.length} done
              </p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-8">
          <div className="w-full h-1 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loadingItems ? (
        <div className="empty-state">
          <p className="text-body-sm text-muted">Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="empty-state-title mt-4">No tasks for today</p>
          <p className="empty-state-description">
            Create routines or promote items from backlog
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(['morning', 'afternoon', 'evening'] as const).map(slot => {
            const slotItems = grouped[slot] || [];
            if (!slotItems.length) return null;
            const config = SLOT_CONFIG[slot];

            return (
              <section key={slot}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-tertiary">{config.icon}</span>
                  <h2 className="section-label">{config.label}</h2>
                </div>
                <div className="space-y-2">
                  {slotItems.map((item: any) => (
                    <div
                      key={item.id}
                      className={`card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                        item.status === 'done' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.status === 'done'}
                          onChange={() => updateStatus(item.id, item.status === 'done' ? 'pending' : 'done')}
                          className="checkbox flex-shrink-0"
                        />
                        <span className={`text-body-sm truncate ${
                          item.status === 'done' ? 'line-through text-muted' : 'text-primary'
                        }`}>
                          {item.title}
                        </span>
                      </div>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className="select w-full min-w-0 flex-shrink-0 px-2 py-2 text-caption sm:w-auto sm:py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="done">Done</option>
                        <option value="skipped">Skipped</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}