import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminRequestTable from '../components/AdminRequestTable';
import AdminLeaveReportCard from '../components/AdminLeaveReportCard';
import { getLeaveRequests, updateLeaveRequestStatus } from '../services/leaveService';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

function LeavePage({ userName, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests'); // requests, monthly-report
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const data = await getLeaveRequests();
      setRequests(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
      setError('Failed to load leave requests');
      // Set mock data for demo purposes
      
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      await updateLeaveRequestStatus(requestId, status);
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status } : req
      ));
    } catch (err) {
      console.error('Failed to update leave request:', err);
      alert('Failed to update leave request');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Leave Management</h1>
          <p className="dashboard-subtitle">Review and manage all leave requests from employees.</p>
        </div>

        <div className="header-info">
          <span>Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="reports-layout admin-dashboard-layout">
        <aside className="reports-sidebar">
          <h2>Dashboard</h2>
          <nav>
            <button type="button" onClick={() => navigate('/admin')}>
              Employee Details
            </button>
            <button type="button" className="active" onClick={() => navigate('/admin/leaves')}>
              Leave Management
            </button>
            <button type="button" onClick={() => navigate('/admin/reports')}>
              Reports
            </button>
            <button type="button" onClick={() => navigate('/admin/attendance')}>
              Attendance
            </button>
            <hr className="reports-sidebar-divider" />
            <button type="button" onClick={() => navigate('/admin/employee/new')}>
              + Create Employee
            </button>
          </nav>
        </aside>

        <main className="reports-main">
          <div className="reports-content-header">
            <h2>{activeTab === 'requests' ? 'Leave Requests' : 'Monthly Leave Report'}</h2>
            <p>
              {activeTab === 'requests'
                ? 'Review employee leave requests and update their approval status.'
                : 'View monthly leave usage and reporting details for employees.'}
            </p>
          </div>

          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Leave Requests
            </button>
            <button 
              className={`tab-btn ${activeTab === 'monthly-report' ? 'active' : ''}`}
              onClick={() => setActiveTab('monthly-report')}
            >
              Monthly Report
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading">Loading leave data...</div>
          ) : (
            <>
              {activeTab === 'requests' && (
                <AdminRequestTable requests={requests} onStatusChange={handleStatusChange} />
              )}
              {activeTab === 'monthly-report' && (
                <AdminLeaveReportCard />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default LeavePage;
