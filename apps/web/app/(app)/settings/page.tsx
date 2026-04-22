'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';

const LINK_POLL_MS = 2000;
const LINK_POLL_MAX_MS = 5 * 60 * 1000;

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [chatIdDraft, setChatIdDraft] = useState('');
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [telegramLinkError, setTelegramLinkError] = useState<string | null>(null);
  const telegramLinkTargetVersionRef = useRef(0);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setLoadingData(true);
    try {
      const data = await api.settings.get();
      setSettings(data);
      setChatIdDraft(data?.telegramChatId || '');
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateTelegram = async (enabled: boolean, chatId?: string) => {
    try {
      await api.settings.update({ telegramEnabled: enabled, telegramChatId: chatId });
      setSettings((s: any) => (s ? { ...s, telegramEnabled: enabled, telegramChatId: chatId } : s));
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const saveChatIdDebounced = useCallback(async (chat: string) => {
    try {
      await api.settings.update({ telegramEnabled: true, telegramChatId: chat });
      setSettings((s: any) => (s ? { ...s, telegramChatId: chat } : s));
    } catch (error) {
      console.error('Failed to update chat id:', error);
    }
  }, []);

  useEffect(() => {
    if (!settings?.telegramEnabled) return;
    const saved = settings.telegramChatId || '';
    if (chatIdDraft === saved) return;

    const t = window.setTimeout(() => {
      void saveChatIdDebounced(chatIdDraft);
    }, 500);
    return () => window.clearTimeout(t);
  }, [chatIdDraft, settings?.telegramEnabled, settings?.telegramChatId, saveChatIdDebounced]);

  useEffect(() => {
    if (!telegramLinking) return;

    const started = Date.now();
    const target = telegramLinkTargetVersionRef.current;

    const tick = async () => {
      try {
        const data = await api.settings.get();
        setSettings(data);
        const last = data?.telegramLastLinkedVersion ?? 0;
        if (last >= target && target > 0) {
          setTelegramLinking(false);
          setTelegramLinkError(null);
          setChatIdDraft(data?.telegramChatId || '');
          telegramLinkTargetVersionRef.current = 0;
          return;
        }
      } catch {
        /* keep polling */
      }
      if (Date.now() - started > LINK_POLL_MAX_MS) {
        setTelegramLinking(false);
        setTelegramLinkError('Timed out waiting for Telegram. Try Connect again.');
        telegramLinkTargetVersionRef.current = 0;
        try {
          await api.settings.update({ telegramLinkPending: false });
          const data = await api.settings.get();
          setSettings(data);
        } catch {
          /* ignore */
        }
      }
    };

    const id = window.setInterval(() => void tick(), LINK_POLL_MS);
    void tick();
    return () => window.clearInterval(id);
  }, [telegramLinking]);

  const connectTelegram = async () => {
    setTelegramLinkError(null);
    try {
      const { deepLink, linkVersion } = await api.settings.createTelegramLink();
      telegramLinkTargetVersionRef.current = linkVersion;
      setTelegramLinking(true);
      window.open(deepLink, '_blank', 'noopener,noreferrer');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not start Telegram link';
      setTelegramLinkError(msg);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body-sm text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-primary sm:text-heading">Settings</h1>
        <p className="mt-1 text-body-sm text-tertiary">Manage your preferences</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">

        {/* Telegram */}
        <div className="card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-lg bg-[var(--surface-hover)] p-2 self-start sm:self-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-body font-medium text-primary">Telegram Reminders</h2>
              <p className="text-body-sm text-tertiary mt-0.5">
                Receive task reminders via Telegram bot
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.telegramEnabled || false}
                    onChange={(e) => updateTelegram(e.target.checked, e.target.checked ? chatIdDraft : settings?.telegramChatId)}
                    className="checkbox"
                  />
                  <span className="text-body-sm text-secondary">Enable reminders</span>
                </label>

                {settings?.telegramEnabled && (
                  <div className="space-y-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => void connectTelegram()}
                        disabled={telegramLinking}
                        className="btn-primary"
                      >
                        {telegramLinking ? 'Waiting for Telegram…' : 'Connect Telegram'}
                      </button>
                      <p className="text-caption text-muted mt-1.5">
                        Opens Telegram with a secure link. After you tap Start, this page will update automatically.
                      </p>
                      {telegramLinkError && (
                        <p className="text-caption mt-1.5 text-[var(--error)]" role="alert">
                          {telegramLinkError}
                        </p>
                      )}
                    </div>

                    <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                      <summary className="cursor-pointer text-body-sm text-secondary">Advanced: enter chat ID manually</summary>
                      <div className="mt-3">
                        <label className="input-label">Chat ID</label>
                        <input
                          type="text"
                          value={chatIdDraft}
                          onChange={(e) => setChatIdDraft(e.target.value)}
                          placeholder="Your Telegram Chat ID"
                          className="input"
                        />
                        <p className="text-caption text-muted mt-1.5">Saved automatically after you pause typing</p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-lg bg-[var(--surface-hover)] p-2 self-start sm:self-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-body font-medium text-primary">Data Retention</h2>
              <p className="text-body-sm text-tertiary mt-0.5">
                How long to keep daily item history
              </p>

              <div className="mt-4">
                <label className="input-label">Days to retain</label>
                <input
                  type="number"
                  value={settings?.retentionDays || 60}
                  onChange={(e) => api.settings.update({ retentionDays: parseInt(e.target.value) })}
                  className="input w-full max-w-[10rem] sm:w-24"
                  min="7"
                  max="365"
                />
                <p className="text-caption text-muted mt-1.5">Between 7 and 365 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-lg bg-[var(--surface-hover)] p-2 self-start sm:self-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-body font-medium text-primary">Account</h2>
              <p className="text-body-sm text-tertiary mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}