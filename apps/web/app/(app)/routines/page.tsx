'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { CategoryField } from '@/components/CategoryField';
import { api } from '@/lib/api';
import { mergeCategorySuggestions } from '@/lib/categorySuggestions';
import { DAYS_OF_WEEK_ORDER, type DayOfWeek, type TimeSlot } from '@vector/types';

const DAY_LABEL: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function formatRoutineSchedule(routine: { rules?: unknown[] }): string {
  const rule = routine.rules?.[0] as
    | { frequency?: string; days?: DayOfWeek[]; slot?: string }
    | undefined;
  if (!rule) return '';
  const slot = rule.slot || 'morning';
  if (rule.frequency === 'daily') {
    return `Every day · ${slot}`;
  }
  if (rule.frequency === 'weekly' && rule.days?.length) {
    return `${rule.days.map(d => DAY_LABEL[d] ?? d).join(', ')} · ${slot}`;
  }
  if (!rule.frequency && (!rule.days || rule.days.length === 0)) {
    return `Every day · ${slot}`;
  }
  if (rule.days?.length) {
    return `${rule.days.map(d => DAY_LABEL[d] ?? d).join(', ')} · ${slot}`;
  }
  return `${slot}`;
}

export default function RoutinesPage() {
  const { user, loading } = useAuth();
  const [routines, setRoutines] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    steps: [{ id: '1', name: '', order: 0, isOptional: false }],
    scheduleFrequency: 'daily' as 'daily' | 'weekly',
    scheduleDays: [] as DayOfWeek[],
    scheduleSlot: 'morning' as TimeSlot,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      loadRoutines();
    }
  }, [user]);

  const loadRoutines = async () => {
    setLoadingData(true);
    try {
      const [routineList, settings] = await Promise.all([api.routines.list(), api.settings.get()]);
      setRoutines(routineList);
      setUserSettings(settings);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const categorySuggestions = useMemo(
    () =>
      mergeCategorySuggestions(
        userSettings?.categories,
        routines.map((r: { category?: string }) => r.category),
      ),
    [userSettings?.categories, routines],
  );

  const handleSave = async () => {
    if (!formData.name || !formData.category) return;
    if (formData.scheduleFrequency === 'weekly' && formData.scheduleDays.length === 0) return;

    setSaving(true);
    try {
      const steps = formData.steps.filter(s => s.name.trim());
      const rules = [
        {
          frequency: formData.scheduleFrequency,
          days: formData.scheduleFrequency === 'daily' ? [] : [...formData.scheduleDays],
          slot: formData.scheduleSlot,
          stepOverrides: [] as { stepId: string; name: string }[],
        },
      ];
      const routine = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        status: 'active' as const,
        steps,
        rules,
      };
      await api.routines.create(routine);
      try {
        const settings = await api.settings.get();
        setUserSettings(settings);
      } catch {
        /* ignore */
      }
      setShowForm(false);
      setFormData({
        name: '',
        category: '',
        description: '',
        steps: [{ id: '1', name: '', order: 0, isOptional: false }],
        scheduleFrequency: 'daily',
        scheduleDays: [],
        scheduleSlot: 'morning',
      });
      loadRoutines();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        { id: Date.now().toString(), name: '', order: formData.steps.length, isOptional: false },
      ],
    });
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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-primary sm:text-heading">Routines</h1>
          <p className="mt-1 text-body-sm text-tertiary">
            {routines.length} routine{routines.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary w-full shrink-0 sm:w-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Routine
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card mb-6 sm:mb-8">
          <h2 className="mb-4 text-subheading sm:mb-5">Create Routine</h2>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="input-label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Morning Skincare"
                />
              </div>
              <CategoryField
                id="routine-category"
                label="Category"
                value={formData.category}
                onChange={category => setFormData({ ...formData, category })}
                suggestions={categorySuggestions}
                placeholder="e.g., Skincare"
              />
            </div>

            <div>
              <label className="input-label">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="input-label mb-2">Steps</label>
              <div className="space-y-2">
                {formData.steps.map((step, index) => (
                  <div key={step.id} className="flex min-w-0 gap-2">
                    <span className="flex items-center justify-center w-6 h-9 text-caption text-muted">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => {
                        const newSteps = [...formData.steps];
                        newSteps[index].name = e.target.value;
                        setFormData({ ...formData, steps: newSteps });
                      }}
                      className="input flex-1"
                      placeholder={`Step ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newSteps = formData.steps.filter((_, i) => i !== index);
                        setFormData({ ...formData, steps: newSteps });
                      }}
                      className="btn-ghost btn-icon text-muted"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addStep} className="btn-ghost mt-2 text-caption">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Step
              </button>
            </div>

            <div>
              <label className="input-label mb-2">Schedule</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={formData.scheduleFrequency === 'daily' ? 'chip-success' : 'chip'}
                  onClick={() => setFormData({ ...formData, scheduleFrequency: 'daily' })}
                >
                  Every day
                </button>
                <button
                  type="button"
                  className={formData.scheduleFrequency === 'weekly' ? 'chip-success' : 'chip'}
                  onClick={() => setFormData({ ...formData, scheduleFrequency: 'weekly' })}
                >
                  Weekly (pick days)
                </button>
              </div>

              {formData.scheduleFrequency === 'weekly' && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK_ORDER.map(d => {
                      const on = formData.scheduleDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          className={on ? 'chip-success min-w-[2.75rem]' : 'chip min-w-[2.75rem]'}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              scheduleDays: on
                                ? formData.scheduleDays.filter(x => x !== d)
                                : [...formData.scheduleDays, d],
                            })
                          }
                        >
                          {DAY_LABEL[d]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-ghost text-caption"
                      onClick={() => setFormData({ ...formData, scheduleDays: [...WEEKDAYS] })}
                    >
                      Mon–Fri
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-caption"
                      onClick={() =>
                        setFormData({ ...formData, scheduleDays: [...DAYS_OF_WEEK_ORDER] as DayOfWeek[] })
                      }
                    >
                      All 7 days
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-caption"
                      onClick={() => setFormData({ ...formData, scheduleDays: [] })}
                    >
                      Clear
                    </button>
                  </div>
                  {formData.scheduleDays.length === 0 && (
                    <p className="text-caption text-[var(--error)]">Select at least one day.</p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="input-label" htmlFor="routine-slot">
                  Time band
                </label>
                <select
                  id="routine-slot"
                  className="input mt-1"
                  value={formData.scheduleSlot}
                  onChange={e => setFormData({ ...formData, scheduleSlot: e.target.value as TimeSlot })}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>

            <div className="divider" />

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  !formData.name ||
                  !formData.category ||
                  (formData.scheduleFrequency === 'weekly' && formData.scheduleDays.length === 0)
                }
                className="btn-primary w-full sm:w-auto"
              >
                {saving ? 'Saving...' : 'Save Routine'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary w-full sm:w-auto">
                Cancel
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
      ) : routines.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          <p className="empty-state-title mt-4">No routines yet</p>
          <p className="empty-state-description">
            Create your first routine to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map(routine => (
            <div key={routine.id} className="card-hover p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-body font-medium text-primary">{routine.name}</h3>
                    <span className={routine.status === 'active' ? 'chip-success' : 'chip'}>
                      {routine.status}
                    </span>
                  </div>
                  <p className="text-caption text-tertiary mt-0.5">{routine.category}</p>
                  <p className="text-caption text-muted mt-0.5">{formatRoutineSchedule(routine)}</p>
                  {routine.description && (
                    <p className="text-body-sm text-secondary mt-2">{routine.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 self-start sm:self-auto">
                  <button type="button" className="btn-ghost btn-icon btn-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                  <button type="button" className="btn-ghost btn-icon btn-sm text-[var(--error)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {routine.steps?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {routine.steps.map((step: any) => (
                    <span key={step.id} className="chip">
                      {step.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}