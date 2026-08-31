import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getHrTimesheets, updateTimesheetStatusAsAdmin, getWeeklyReportsForHr } from '../services/timesheetService';
import '../styles/tailwind.css';

const STATUS_CLASSES = {
  pending: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  approved: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  rejected: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold capitalize ${
        STATUS_CLASSES[key] || 'border-border bg-muted text-muted-foreground'
      }`}
    >
      {status}
    </span>
  );
}

function AdminTimesheetsPage({ userName, onLogout }) {
  const [timesheets, setTimesheets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTimesheets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [benchData, weeklyData] = await Promise.all([
        getHrTimesheets(statusFilter),
        getWeeklyReportsForHr(),
      ]);
      setTimesheets(benchData || []);
      setWeeklyReports(weeklyData || []);
    } catch (err) {
      console.error('Failed to load HR timesheet queue', err);
      setError('Unable to load timesheets right now.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  const handleDecision = async (id, status) => {
    if (!window.confirm(`${status} this timesheet entry?`)) return;
    try {
      await updateTimesheetStatusAsAdmin(id, status);
      await loadTimesheets();
    } catch (err) {
      alert(err.message || 'Failed to update timesheet');
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="timesheets"
      title="HR Timesheets"
      subtitle="Bench employees' daily updates land here directly; project employees' updates are rolled up weekly by their Project Manager below."
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
            <h3 className="text-base font-semibold text-foreground">Bench Employee Updates (Daily)</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
          )}

          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Loading...</p>
          ) : timesheets.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No bench timesheets match this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 720 }}>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    {['Employee', 'Date', 'Hours', 'Description', 'Status', 'Action'].map((col) => (
                      <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">{entry.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.workDate}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.hoursWorked ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.description}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.status} />
                      </td>
                      <td className="px-4 py-3">
                        {entry.status === 'Pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDecision(entry.id, 'Approved')}
                              className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(entry.id, 'Rejected')}
                              className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e2]"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/80 bg-card shadow-sm">
          <h3 className="border-b border-border/80 px-5 py-4 text-base font-semibold text-foreground">Project Manager Weekly Reports</h3>
          {weeklyReports.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No weekly reports submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 780 }}>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    {['Manager', 'Week', 'Entries', 'Sent On', 'Notes', 'Action'].map((col) => (
                      <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklyReports.map((report) => (
                    <React.Fragment key={report.id}>
                      <tr className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-foreground">{report.managerName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{report.weekStartDate} to {report.weekEndDate}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{report.entries?.length ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{report.submittedAt}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{report.notes || '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                            className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            {expandedReportId === report.id ? 'Close' : 'View Entries'}
                          </button>
                        </td>
                      </tr>
                      {expandedReportId === report.id && (
                        <tr>
                          <td colSpan={6} className="bg-muted/20 px-4 py-4">
                            <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
                              <table className="w-full text-left" style={{ minWidth: 600 }}>
                                <thead>
                                  <tr className="border-b border-border/80 bg-muted/40">
                                    {['Employee', 'Date', 'Hours', 'Description', 'Status'].map((col) => (
                                      <th key={col} className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(report.entries || []).map((entry) => (
                                    <tr key={entry.id} className="border-b border-border/60 last:border-0">
                                      <td className="px-3 py-2 text-sm text-foreground">{entry.employeeName}</td>
                                      <td className="px-3 py-2 text-sm text-muted-foreground">{entry.workDate}</td>
                                      <td className="px-3 py-2 text-sm text-muted-foreground">{entry.hoursWorked ?? '—'}</td>
                                      <td className="px-3 py-2 text-sm text-muted-foreground">{entry.description}</td>
                                      <td className="px-3 py-2">
                                        <StatusBadge status={entry.status} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminTimesheetsPage;
