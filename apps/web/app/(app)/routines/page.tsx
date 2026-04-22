'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';

export default function RoutinesPage() {
  const { user, loading } = useAuth();
  const [routines, setRoutines] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    steps: [{ id: '1', name: '', order: 0, isOptional: false }],
    rules: [{ days: [], slot: 'morning', stepOverrides: [] }],
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
      const data = await api.routines.list();
      setRoutines(data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category) return;

    setSaving(true);
    try {
      const routine = {
        ...formData,
        status: 'active',
        steps: formData.steps.filter(s => s.name.trim()),
      };
      await api.routines.create(routine);
      setShowForm(false);
      setFormData({
        name: '',
        category: '',
        description: '',
        steps: [{ id: '1', name: '', order: 0, isOptional: false }],
        rules: [{ days: [], slot: 'morning', stepOverrides: [] }],
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading">Routines</h1>
          <p className="text-body-sm text-tertiary mt-1">
            {routines.length} routine{routines.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Routine
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="text-subheading mb-5">Create Routine</h2>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="input-label">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  placeholder="e.g., Skincare"
                />
              </div>
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
                  <div key={step.id} className="flex gap-2">
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
              <button onClick={addStep} className="btn-ghost text-caption mt-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Step
              </button>
            </div>

            <div className="divider" />

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !formData.name || !formData.category} className="btn-primary">
                {saving ? 'Saving...' : 'Save Routine'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
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
            <div key={routine.id} className="card-hover p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-body font-medium text-primary truncate">{routine.name}</h3>
                    <span className={routine.status === 'active' ? 'chip-success' : 'chip'}>
                      {routine.status}
                    </span>
                  </div>
                  <p className="text-caption text-tertiary mt-0.5">{routine.category}</p>
                  {routine.description && (
                    <p className="text-body-sm text-secondary mt-2">{routine.description}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button className="btn-ghost btn-icon btn-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                  <button className="btn-ghost btn-icon btn-sm text-[var(--error)]">
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