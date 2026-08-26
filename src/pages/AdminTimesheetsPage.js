import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getHrTimesheets, updateTimesheetStatusAsAdmin, getWeeklyReportsForHr } from '../services/timesheetService';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

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
      <div className="attendance-data-table" style={{ marginBottom: '24px' }}>
        <h3>Bench Employee Updates (Daily)</h3>
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

        {error && <div className="attendance-error">{error}</div>}

        {loading ? (
          <p style={{ padding: '16px' }}>Loading...</p>
        ) : timesheets.length === 0 ? (
          <p style={{ padding: '16px', color: '#475569' }}>No bench timesheets match this filter.</p>
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
              {timesheets.map((entry) => (
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
                        <button className="small-button" onClick={() => handleDecision(entry.id, 'Approved')}>
                          Approve
                        </button>{' '}
                        <button className="small-button reject" onClick={() => handleDecision(entry.id, 'Rejected')}>
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

      <div className="attendance-data-table">
        <h3>Project Manager Weekly Reports</h3>
        {weeklyReports.length === 0 ? (
          <p style={{ padding: '16px', color: '#475569' }}>No weekly reports submitted yet.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Manager</th>
                <th>Week</th>
                <th>Entries</th>
                <th>Sent On</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {weeklyReports.map((report) => (
                <React.Fragment key={report.id}>
                  <tr>
                    <td>{report.managerName}</td>
                    <td>{report.weekStartDate} to {report.weekEndDate}</td>
                    <td>{report.entries?.length ?? 0}</td>
                    <td>{report.submittedAt}</td>
                    <td>{report.notes || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="small-button"
                        onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                      >
                        {expandedReportId === report.id ? 'Close' : 'View Entries'}
                      </button>
                    </td>
                  </tr>
                  {expandedReportId === report.id && (
                    <tr>
                      <td colSpan="6">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Date</th>
                              <th>Hours</th>
                              <th>Description</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(report.entries || []).map((entry) => (
                              <tr key={entry.id}>
                                <td>{entry.employeeName}</td>
                                <td>{entry.workDate}</td>
                                <td>{entry.hoursWorked ?? '—'}</td>
                                <td>{entry.description}</td>
                                <td>
                                  <span className={`status-tag ${entry.status?.toLowerCase()}`}>{entry.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminTimesheetsPage;
