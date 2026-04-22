'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { getTodayDateString } from '@vector/utils';

type Row = {
  date: string;
  total: number;
  done: number;
  pending: number;
  skipped: number;
  rescheduled: number;
};

export default function StatsPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<{
    endDate: string;
    days: number;
    rows: Row[];
    periodDone: number;
    periodTotal: number;
    periodRate: number | null;
  } | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [rangeDays, setRangeDays] = useState(14);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoadingData(true);
      try {
        const end = getTodayDateString();
        const res = await api.stats.dailyCompletion(end, rangeDays);
        if (!cancelled) setData(res);
      } catch (e) {
        console.error(e);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, rangeDays]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body-sm text-muted">Cargando…</p>
      </div>
    );
  }

  const todayRow = data?.rows?.find(r => r.date === data.endDate);

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-primary sm:text-heading">Estadísticas</h1>
        <p className="mt-1 text-body-sm text-tertiary">Completado diario y tendencia reciente</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="input-label">Rango (días)</label>
          <select
            className="select mt-1"
            value={rangeDays}
            onChange={e => setRangeDays(Number(e.target.value))}
          >
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </div>
        {data && (
          <p className="text-body-sm text-muted pb-1">
            Hasta <span className="text-secondary">{data.endDate}</span>
          </p>
        )}
      </div>

      {loadingData && (
        <div className="empty-state">
          <p className="text-body-sm text-muted">Cargando datos…</p>
        </div>
      )}

      {!loadingData && data && (
        <div className="space-y-8">
          <section className="card p-4 sm:p-5">
            <h2 className="text-body font-medium text-primary">Hoy</h2>
            {todayRow && todayRow.total > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-6 text-body-sm">
                  <div>
                    <span className="text-tertiary">Completadas</span>
                    <p className="text-lg font-semibold text-primary tabular-nums">
                      {todayRow.done}/{todayRow.total}
                    </p>
                  </div>
                  <div>
                    <span className="text-tertiary">Pendientes</span>
                    <p className="text-lg font-semibold text-primary tabular-nums">{todayRow.pending}</p>
                  </div>
                  <div>
                    <span className="text-tertiary">Omitidas / reprog.</span>
                    <p className="text-lg font-semibold text-primary tabular-nums">
                      {todayRow.skipped + todayRow.rescheduled}
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${(todayRow.done / todayRow.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-body-sm text-muted">No hay tareas registradas para hoy en este rango.</p>
            )}
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="text-body font-medium text-primary">Periodo seleccionado</h2>
            <p className="mt-2 text-body-sm text-tertiary">
              {data.periodTotal > 0 ? (
                <>
                  <span className="text-primary font-medium tabular-nums">{data.periodDone}</span> completadas
                  de <span className="tabular-nums">{data.periodTotal}</span> tareas
                  {data.periodRate != null && (
                    <span className="text-muted"> ({data.periodRate}%)</span>
                  )}
                </>
              ) : (
                'Sin datos en este periodo.'
              )}
            </p>
          </section>

          <section>
            <h2 className="section-label mb-3">Barras por día (hechas / total)</h2>
            <div className="space-y-2">
              {[...data.rows].reverse().map(row => {
                const pct = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;
                const isToday = row.date === data.endDate;
                return (
                  <div
                    key={row.date}
                    className={`card p-3 sm:p-4 ${isToday ? 'ring-1 ring-[var(--accent)]/40' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3 text-caption sm:text-body-sm">
                      <span className={`font-medium ${isToday ? 'text-primary' : 'text-secondary'}`}>
                        {row.date}
                        {isToday && <span className="ml-2 text-muted font-normal">(hoy)</span>}
                      </span>
                      <span className="tabular-nums text-tertiary shrink-0">
                        {row.done}/{row.total}
                        {row.total > 0 && <span className="text-muted"> · {pct}%</span>}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]/90"
                        style={{ width: row.total > 0 ? `${pct}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
