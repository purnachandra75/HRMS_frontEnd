import React, { useEffect, useState } from 'react';
import { getLeaveSettings, updateLeaveSettings } from '../services/leaveSettingsService';
import AdminLayout from '../components/AdminLayout';
import '../styles/tailwind.css';

const DEFAULT_FORM = {
  casualLeaveAllocation: 12,
  sickLeaveAllocation: 8,
  paidLeaveAllocation: 20,
};

function LeaveSettingsPage({ userName, onLogout }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const settings = await getLeaveSettings();
        setForm({
          casualLeaveAllocation: settings.casualLeaveAllocation ?? 12,
          sickLeaveAllocation: settings.sickLeaveAllocation ?? 8,
          paidLeaveAllocation: settings.paidLeaveAllocation ?? 20,
        });
      } catch (err) {
        console.error('Failed to load leave settings:', err);
        setError(err.message || 'Failed to load leave settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleNumberFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value === '' ? '' : Number(value) }));
  };

  const hasNegativeValue = Object.values(form).some((value) => value !== '' && Number(value) < 0);

  const handleSave = async () => {
    if (hasNegativeValue) return;

    setSaving(true);
    setError('');
    setStatusMessage('');
    try {
      await updateLeaveSettings(form);
      setStatusMessage('Leave settings saved successfully.');
    } catch (err) {
      console.error('Failed to save leave settings:', err);
      setError(err.message || 'Failed to save leave settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="leave-settings"
      title="Leave Settings"
      subtitle="Set the number of paid Casual, Sick and Paid leaves your organization grants employees each year."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading leave settings...</p>
      ) : (
        <div className="flex flex-col gap-5">
          {(error || statusMessage) && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                error
                  ? 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                  : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
              }`}
            >
              {error || statusMessage}
            </div>
          )}

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Annual Leave Allocation</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Number of days each employee is credited with per year. New employees, and any
              employee missing a balance, are seeded using these counts instead of the app-wide
              default.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Casual Leave (days/year)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.casualLeaveAllocation}
                  onChange={(e) => handleNumberFieldChange('casualLeaveAllocation', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Sick Leave (days/year)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.sickLeaveAllocation}
                  onChange={(e) => handleNumberFieldChange('sickLeaveAllocation', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Paid Leave (days/year)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.paidLeaveAllocation}
                  onChange={(e) => handleNumberFieldChange('paidLeaveAllocation', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
            </div>

            {hasNegativeValue && (
              <p className="mt-3 text-sm text-[#b91c1c]">Leave allocations cannot be negative.</p>
            )}
          </section>

          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || hasNegativeValue}
              className="h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default LeaveSettingsPage;
