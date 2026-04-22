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
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

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

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      await api.backlog.create({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
      });
      setShowForm(false);
      setFormData({ title: '', description: '', priority: 'medium' });
      await loadBacklog();
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setSaving(false);
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
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-primary sm:text-heading">Backlog</h1>
          <p className="mt-1 text-body-sm text-tertiary">
            {pendingItems.length} pending item{pendingItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary w-full shrink-0 sm:w-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Item
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 sm:mb-8">
          <h2 className="mb-4 text-subheading sm:mb-5">New backlog item</h2>
          <div className="space-y-4">
            <div>
              <label className="input-label">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="What do you want to do?"
              />
            </div>
            <div>
              <label className="input-label">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[5rem] py-2"
                rows={3}
                placeholder="Notes…"
              />
            </div>
            <div>
              <label className="input-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })
                }
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary order-2 sm:order-1" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary order-1 sm:order-2"
                disabled={saving || !formData.title.trim()}
                onClick={() => void handleCreate()}
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div key={item.id} className="card-hover p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-body font-medium text-primary">{item.title}</h3>
                  {item.description && (
                    <p className="text-body-sm text-secondary mt-1">{item.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
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
                  type="button"
                  onClick={() => promoteToToday(item.id)}
                  className="btn-secondary btn-sm w-full shrink-0 sm:w-auto"
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