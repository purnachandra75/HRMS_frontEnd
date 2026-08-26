import React, { useCallback, useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import { submitTimesheet, getMyTimesheets } from '../services/timesheetService';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

const todayISO = () => new Date().toISOString().split('T')[0];

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
      <div className="attendance-data-table" style={{ marginBottom: '24px' }}>
        <h3>Submit Today's Update</h3>
        <form onSubmit={handleSubmit} className="profile-form" style={{ padding: '16px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={form.workDate}
                onChange={(e) => setForm({ ...form, workDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Hours Worked</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.hoursWorked}
                onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>What did you work on?</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Summarize today's work"
                style={{ width: '100%', padding: '8px', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <button type="submit" className="create-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="attendance-data-table">
        <h3>My Submissions</h3>
        {error && <div className="attendance-error">{error}</div>}
        {loading ? (
          <p style={{ padding: '16px' }}>Loading...</p>
        ) : history.length === 0 ? (
          <p style={{ padding: '16px', color: '#475569' }}>No timesheet entries yet.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours</th>
                <th>Description</th>
                <th>Routed To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.workDate}</td>
                  <td>{entry.hoursWorked ?? '—'}</td>
                  <td>{entry.description}</td>
                  <td>{entry.submittedTo === 'HR' ? 'HR' : 'Project Manager'}</td>
                  <td>
                    <span className={`status-tag ${entry.status?.toLowerCase()}`}>{entry.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default TimesheetPage;
