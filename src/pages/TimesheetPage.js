import React, { useCallback, useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import { submitTimesheet, getMyTimesheets } from '../services/timesheetService';
import '../styles/tailwind.css';

const todayISO = () => new Date().toISOString().split('T')[0];

const STATUS_CLASSES = {
  pending: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  approved: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  rejected: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

function TimesheetPage({ userName, onLogout }) {
  const [form, setForm] = useState({ workDate: todayISO(), description: '', hoursWorked: '' });
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyTimesheets();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load timesheet history', err);
      setError('Unable to load your timesheet history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert('Describe what you worked on today');
      return;
    }
    setSubmitting(true);
    try {
      await submitTimesheet({
        workDate: form.workDate,
        description: form.description.trim(),
        hoursWorked: form.hoursWorked ? Number(form.hoursWorked) : null,
      });
      setForm({ workDate: todayISO(), description: '', hoursWorked: '' });
      await loadHistory();
    } catch (err) {
      alert(err.message || 'Failed to submit timesheet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="timesheet"
      title="Daily Timesheet"
      subtitle="Log what you worked on today. If you're on a project, it goes to your Project Manager for review - otherwise it goes to HR."
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Submit Today's Update</h3>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Date</label>
                <input
                  type="date"
                  value={form.workDate}
                  onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={form.hoursWorked}
                  onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
                  placeholder="Optional"
                  className="h-9 w-32 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">What did you work on?</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Summarize today's work"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 w-fit rounded-lg bg-employee px-4 text-sm font-medium text-employee-foreground hover:bg-employee/90 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-border/80 bg-card shadow-sm">
          <h3 className="border-b border-border/80 px-5 py-4 text-base font-semibold text-foreground">My Submissions</h3>
          {error && (
            <div className="mx-5 mt-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
          )}
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Loading...</p>
          ) : history.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No timesheet entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 640 }}>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    {['Date', 'Hours', 'Description', 'Routed To', 'Status'].map((col) => (
                      <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => {
                    const statusKey = (entry.status || '').toLowerCase();
                    return (
                      <tr key={entry.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-foreground">{entry.workDate}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{entry.hoursWorked ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{entry.description}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{entry.submittedTo === 'HR' ? 'HR' : 'Project Manager'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold capitalize ${
                              STATUS_CLASSES[statusKey] || 'border-border bg-muted text-muted-foreground'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}

export default TimesheetPage;
