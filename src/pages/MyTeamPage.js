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
import '../styles/Dashboard.css';
import '../styles/Leave.css';

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

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="my-team"
      title="My Team"
      subtitle="View your team members and act on their leave requests."
    >
      {loading ? (
        <p>Loading your team...</p>
      ) : forbidden ? (
        <div className="attendance-data-table" style={{ padding: '24px', color: '#475569' }}>
          You don't currently manage a team. This page is only available to employees marked as
          a Project Manager on an active project.
        </div>
      ) : (
        <>
          {error && <div className="attendance-error">{error}</div>}

          <div className="attendance-data-table" style={{ marginBottom: '24px', padding: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { key: 'members', label: `Team Members (${team.length})` },
                { key: 'leaves', label: `Team Leave Requests (${requests.length})` },
                { key: 'timesheets', label: `Team Timesheets (${timesheets.length})` },
                { key: 'weekly', label: 'Weekly Report to HR' },
              ].map((section) => (
                <button
                  key={section.key}
                  type="button"
                  className="small-button"
                  style={
                    activeSection === section.key
                      ? { backgroundColor: '#4f46e5', color: '#fff', borderColor: '#4f46e5' }
                      : undefined
                  }
                  onClick={() => setActiveSection(section.key)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {activeSection === 'members' && (
          <div className="attendance-data-table" style={{ marginBottom: '24px' }}>
            <h3>Team Members ({team.length})</h3>
            {team.length === 0 ? (
              <p style={{ padding: '16px', color: '#475569' }}>No one is currently assigned to your projects.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Today</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => (
                    <tr key={member.empId}>
                      <td>{member.name}</td>
                      <td>{member.designation || '—'}</td>
                      <td>{member.department || '—'}</td>
                      <td>
                        <span className={member.attendanceStatus === 'ABSENT' ? 'absent-badge' : 'present-badge'}>
                          {member.attendanceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          )}

          {activeSection === 'leaves' && (
          <div className="attendance-data-table">
            <h3>Team Leave Requests</h3>
            <div className="report-controls-top" style={{ padding: '0 16px' }}>
              <div>
                <label>Status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {requests.length === 0 ? (
              <p style={{ padding: '16px', color: '#475569' }}>No leave requests match this filter.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.employeeName}</td>
                      <td>{req.leaveType}</td>
                      <td>{req.fromDate}</td>
                      <td>{req.toDate}</td>
                      <td>{req.days}</td>
                      <td>
                        <span className={`status-tag ${req.status?.toLowerCase()}`}>{req.status}</span>
                      </td>
                      <td>
                        {req.status === 'Pending' ? (
                          <>
                            <button className="small-button" onClick={() => handleDecision(req.id, 'Approved')}>
                              Approve
                            </button>{' '}
                            <button className="small-button reject" onClick={() => handleDecision(req.id, 'Rejected')}>
                              Reject
                            </button>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          )}

          {activeSection === 'timesheets' && (
          <div className="attendance-data-table" style={{ marginTop: '24px' }}>
            <h3>Team Timesheets</h3>
            <div className="report-controls-top" style={{ padding: '0 16px' }}>
              <div>
                <label>Status:</label>
                <select value={timesheetFilter} onChange={(e) => setTimesheetFilter(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div>
                <label>Employee:</label>
                <select
                  value={timesheetEmployeeFilter}
                  onChange={(e) => setTimesheetEmployeeFilter(e.target.value)}
                >
                  <option value="">All Members</option>
                  {team.map((member) => (
                    <option key={member.empId} value={member.empId}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {visibleTimesheets.length === 0 ? (
              <p style={{ padding: '16px', color: '#475569' }}>No timesheet entries match this filter.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTimesheets.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.employeeName}</td>
                      <td>{entry.workDate}</td>
                      <td>{entry.hoursWorked ?? '—'}</td>
                      <td>{entry.description}</td>
                      <td>
                        <span className={`status-tag ${entry.status?.toLowerCase()}`}>{entry.status}</span>
                      </td>
                      <td>
                        {entry.status === 'Pending' ? (
                          <>
                            <button className="small-button" onClick={() => handleTimesheetDecision(entry.id, 'Approved')}>
                              Approve
                            </button>{' '}
                            <button className="small-button reject" onClick={() => handleTimesheetDecision(entry.id, 'Rejected')}>
                              Reject
                            </button>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          )}

          {activeSection === 'weekly' && (
          <div className="attendance-data-table" style={{ marginTop: '24px' }}>
            <h3>Weekly Report to HR</h3>
            <p style={{ padding: '0 16px', color: '#475569' }}>
              Bundle your team's timesheet entries for a week into a single report for HR - sent
              once, instead of HR reviewing each daily update individually.
            </p>
            <form onSubmit={handleSendWeeklyReport} className="profile-form" style={{ padding: '16px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Week Start</label>
                  <input
                    type="date"
                    value={weeklyForm.weekStartDate}
                    onChange={(e) => setWeeklyForm({ ...weeklyForm, weekStartDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Week End</label>
                  <input
                    type="date"
                    value={weeklyForm.weekEndDate}
                    onChange={(e) => setWeeklyForm({ ...weeklyForm, weekEndDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={weeklyForm.notes}
                    onChange={(e) => setWeeklyForm({ ...weeklyForm, notes: e.target.value })}
                    placeholder="Anything HR should know about this week"
                    style={{ width: '100%', padding: '8px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <button type="submit" className="create-btn" disabled={sendingReport}>
                    {sendingReport ? 'Sending...' : 'Send Weekly Report to HR'}
                  </button>
                </div>
              </div>
            </form>

            {weeklyReports.length > 0 && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Entries</th>
                    <th>Sent On</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyReports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.weekStartDate} to {report.weekEndDate}</td>
                      <td>{report.entries?.length ?? 0}</td>
                      <td>{report.submittedAt}</td>
                      <td>{report.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          )}
        </>
      )}
    </EmployeeLayout>
  );
}

export default MyTeamPage;
