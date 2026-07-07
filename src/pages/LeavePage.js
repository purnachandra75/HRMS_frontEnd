import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminRequestTable from '../components/AdminRequestTable';
import AdminLeaveReportCard from '../components/AdminLeaveReportCard';
import AdminLayout from '../components/AdminLayout';
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
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      await updateLeaveRequestStatus(requestId, status);
      setRequests((current) => current.map(req => req.id === requestId ? { ...req, status } : req));
    } catch (err) {
      console.error('Failed to update leave request:', err);
      alert('Failed to update leave request');
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="leaves"
      title={activeTab === 'requests' ? 'Leave Requests' : 'Monthly Leave Report'}
      subtitle={activeTab === 'requests' ? 'Review employee leave requests and update their approval status.' : 'View monthly leave usage and reporting details for employees.'}
    >
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
    </AdminLayout>
  );
}

export default LeavePage;
