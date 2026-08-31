import React, { useCallback, useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import {
  getMyTeam,
  getTeamLeaveRequests,
  updateTeamLeaveRequestStatus,
  submitWeeklyReport,
  getMyWeeklyReports,
} from '../services/managerService';
import { getTeamTimesheets, updateTeamTimesheetStatus } from '../services/timesheetService';
import '../styles/tailwind.css';

const toISO = (d) => d.toISOString().split('T')[0];

// Monday-Sunday of the current week, so the weekly-report form defaults to "this week".
const currentWeekBounds = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekStartDate: toISO(monday), weekEndDate: toISO(sunday) };
};

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

function MyTeamPage({ userName, onLogout }) {
  const [forbidden, setForbidden] = useState(false);
  const [team, setTeam] = useState([]);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [timesheets, setTimesheets] = useState([]);
  const [timesheetFilter, setTimesheetFilter] = useState('Pending');
  const [timesheetEmployeeFilter, setTimesheetEmployeeFilter] = useState('');
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [weeklyForm, setWeeklyForm] = useState({ ...currentWeekBounds(), notes: '' });
  const [sendingReport, setSendingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('members');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    // allSettled on purpose: each call already turns "not a manager" (and any unexpected
    // non-2xx, e.g. an endpoint the running backend doesn't have yet) into a clean
    // { forbidden: true } result rather than throwing. If one call still genuinely throws
    // (network failure, etc.) the others' data shouldn't be wiped out along with it.
    const [teamResult, requestsResult, timesheetResult, weeklyResult] = await Promise.allSettled([
      getMyTeam(),
      getTeamLeaveRequests(statusFilter),
      getTeamTimesheets(timesheetFilter),
      getMyWeeklyReports(),
    ]);

    const value = (result, fallback) => (result.status === 'fulfilled' ? result.value : fallback);
    const team = value(teamResult, { forbidden: true, team: [] });
    const requests = value(requestsResult, { forbidden: true, requests: [] });
    const timesheetData = value(timesheetResult, { forbidden: true, timesheets: [] });
    const weekly = value(weeklyResult, { forbidden: true, reports: [] });

    const anyRejected = [teamResult, requestsResult, timesheetResult, weeklyResult]
        .some((r) => r.status === 'rejected');
    if (anyRejected) {
      console.error('Failed to load some team data', { teamResult, requestsResult, timesheetResult, weeklyResult });
      setError('Some team data could not be loaded - showing what is available.');
    }

    setForbidden(team.forbidden || requests.forbidden || timesheetData.forbidden || weekly.forbidden);
    setTeam(team.team || []);
    setRequests(requests.requests || []);
    setTimesheets(timesheetData.timesheets || []);
    setWeeklyReports(weekly.reports || []);
    setLoading(false);
  }, [statusFilter, timesheetFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSendWeeklyReport = async (e) => {
    e.preventDefault();
    setSendingReport(true);
    try {
      await submitWeeklyReport(weeklyForm);
      setWeeklyForm({ ...currentWeekBounds(), notes: '' });
      await loadAll();
      alert('Weekly report sent to HR');
    } catch (err) {
      alert(err.message || 'Failed to send weekly report');
    } finally {
      setSendingReport(false);
    }
  };

  const handleDecision = async (requestId, status) => {
    if (!window.confirm(`${status} this leave request?`)) return;
    try {
      await updateTeamLeaveRequestStatus(requestId, status);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update leave request');
    }
  };

  const handleTimesheetDecision = async (timesheetId, status) => {
    if (!window.confirm(`${status} this timesheet entry?`)) return;
    try {
      await updateTeamTimesheetStatus(timesheetId, status);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update timesheet');
    }
  };

  // Newest first, optionally narrowed to one project member.
  const visibleTimesheets = timesheets
    .filter((entry) => !timesheetEmployeeFilter || String(entry.empId) === timesheetEmployeeFilter)
    .slice()
    .sort((a, b) => (a.workDate < b.workDate ? 1 : a.workDate > b.workDate ? -1 : 0));

  const sections = [
    { key: 'members', label: `Team Members (${team.length})` },
    { key: 'leaves', label: `Team Leave Requests (${requests.length})` },
    { key: 'timesheets', label: `Team Timesheets (${timesheets.length})` },
    { key: 'weekly', label: 'Weekly Report to HR' },
  ];

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="my-team"
      title="My Team"
      subtitle="View your team members and act on their leave requests."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your team...</p>
      ) : forbidden ? (
        <div className="rounded-xl border border-border/80 bg-card p-6 text-sm text-muted-foreground shadow-sm">
          You don't currently manage a team. This page is only available to employees marked as
          a Project Manager on an active project.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {error && (
            <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
          )}

          <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-card p-3 shadow-sm">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeSection === section.key
                    ? 'bg-employee text-employee-foreground'
                    : 'border border-border bg-white text-foreground hover:bg-muted'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {activeSection === 'members' && (
            <div className="rounded-xl border border-border/80 bg-card shadow-sm">
              <h3 className="border-b border-border/80 px-5 py-4 text-base font-semibold text-foreground">Team Members ({team.length})</h3>
              {team.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">No one is currently assigned to your projects.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 560 }}>
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40">
                        {['Name', 'Designation', 'Department', 'Today'].map((col) => (
                          <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {team.map((member) => (
                        <tr key={member.empId} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm text-foreground">{member.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{member.designation || '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{member.department || '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                                member.attendanceStatus === 'ABSENT'
                                  ? 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                                  : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                              }`}
                            >
                              {member.attendanceStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'leaves' && (
            <div className="rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
                <h3 className="text-base font-semibold text-foreground">Team Leave Requests</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>

              {requests.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">No leave requests match this filter.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 700 }}>
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40">
                        {['Employee', 'Type', 'From', 'To', 'Days', 'Status', 'Action'].map((col) => (
                          <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm text-foreground">{req.employeeName}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{req.leaveType}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{req.fromDate}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{req.toDate}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{req.days}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-4 py-3">
                            {req.status === 'Pending' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDecision(req.id, 'Approved')}
                                  className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleDecision(req.id, 'Rejected')}
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
          )}

          {activeSection === 'timesheets' && (
            <div className="rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
                <h3 className="text-base font-semibold text-foreground">Team Timesheets</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Status:</label>
                    <select
                      value={timesheetFilter}
                      onChange={(e) => setTimesheetFilter(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Employee:</label>
                    <select
                      value={timesheetEmployeeFilter}
                      onChange={(e) => setTimesheetEmployeeFilter(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                    >
                      <option value="">All Members</option>
                      {team.map((member) => (
                        <option key={member.empId} value={member.empId}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {visibleTimesheets.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">No timesheet entries match this filter.</p>
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
                      {visibleTimesheets.map((entry) => (
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
                                  onClick={() => handleTimesheetDecision(entry.id, 'Approved')}
                                  className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleTimesheetDecision(entry.id, 'Rejected')}
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
          )}

          {activeSection === 'weekly' && (
            <div className="rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="border-b border-border/80 px-5 py-4">
                <h3 className="text-base font-semibold text-foreground">Weekly Report to HR</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bundle your team's timesheet entries for a week into a single report for HR - sent
                  once, instead of HR reviewing each daily update individually.
                </p>
              </div>
              <form onSubmit={handleSendWeeklyReport} className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Week Start</label>
                    <input
                      type="date"
                      value={weeklyForm.weekStartDate}
                      onChange={(e) => setWeeklyForm({ ...weeklyForm, weekStartDate: e.target.value })}
                      className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Week End</label>
                    <input
                      type="date"
                      value={weeklyForm.weekEndDate}
                      onChange={(e) => setWeeklyForm({ ...weeklyForm, weekEndDate: e.target.value })}
                      className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={weeklyForm.notes}
                    onChange={(e) => setWeeklyForm({ ...weeklyForm, notes: e.target.value })}
                    placeholder="Anything HR should know about this week"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingReport}
                  className="h-9 w-fit rounded-lg bg-employee px-4 text-sm font-medium text-employee-foreground hover:bg-employee/90 disabled:opacity-60"
                >
                  {sendingReport ? 'Sending...' : 'Send Weekly Report to HR'}
                </button>
              </form>

              {weeklyReports.length > 0 && (
                <div className="overflow-x-auto border-t border-border/80">
                  <table className="w-full text-left" style={{ minWidth: 560 }}>
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40">
                        {['Week', 'Entries', 'Sent On', 'Notes'].map((col) => (
                          <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyReports.map((report) => (
                        <tr key={report.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3 text-sm text-foreground">{report.weekStartDate} to {report.weekEndDate}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{report.entries?.length ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{report.submittedAt}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{report.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </EmployeeLayout>
  );
}

export default MyTeamPage;
