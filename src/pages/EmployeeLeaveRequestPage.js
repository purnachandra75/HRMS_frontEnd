import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../components/EmployeeLayout';
import LeaveRequestForm from '../components/LeaveRequestForm';
import EmployeeRequestTable from '../components/EmployeeRequestTable';
import LeaveBalances from '../components/LeaveBalances';
import { 
  getEmployeeLeaveRequests, 
  createLeaveRequest, 
  getLeaveBalances 
} from '../services/leaveService';
import { calculateDaysBetween } from '../utils/leaveUtils';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

function EmployeeLeaveRequestPage({ userName, userId, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, apply-leave
  const [formData, setFormData] = useState({
    type: 'casual',
    fromDate: '',
    toDate: '',
    reason: ''
  });
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEmployeeData();
  }, [userId]);

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const [requestsData, balancesData] = await Promise.all([
        getEmployeeLeaveRequests(userId),
        getLeaveBalances(userId)
      ]);
      console.log("User ID:", userId);
      console.log("Requests Data:", requestsData);
      console.log("Balances Data:", balancesData);

      setRequests(requestsData);
      setBalances(balancesData);
      setError(null);
    } catch (err) {
      console.error('Failed to load employee data:', err);
      // Set mock data for demo purposes
      setRequests([
        { id: 201, leaveType: 'casual', days: 2, status: 'Approved', fromDate: '2026-05-15', toDate: '2026-05-16', createdAt: '2026-05-15' },
        { id: 202, leaveType: 'sick', days: 1, status: 'Pending', fromDate: '2026-06-01', toDate: '2026-06-01', createdAt: '2026-06-01' }
      ]);
      setBalances({
        casual: 8,
        sick: 9,
        paid: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (newFormData) => {
    setFormData(newFormData);
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert('User ID is not available. Please log in again.');
      return;
    }

    if (!formData.type || !formData.fromDate || !formData.toDate || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }

    const days = calculateDaysBetween(formData.fromDate, formData.toDate);
    
    if (days <= 0) {
      alert('Please choose a valid date range with at least one working day. Saturdays and Sundays are not counted.');
      return;
    }
    
    try {
      const requestData = {
        employeeId: userId,
        type: formData.type,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        days,
        reason: formData.reason
      };

      console.log('Submitting leave request:', requestData);
      
      const newRequest = await createLeaveRequest(requestData);
      setRequests([...requests, newRequest]);
      setFormData({
        type: 'casual',
        fromDate: '',
        toDate: '',
        reason: ''
      });
      setActiveTab('dashboard');
      alert('Leave request submitted successfully!');
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      const errorMsg = err.message || 'Failed to submit leave request. Please try again.';
      alert(errorMsg);
    }
  };

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="leaves"
      title="Leave Requests"
      subtitle="Track balances, submit new leave requests, and review your leave history."
    >
      <div className="dashboard-main employee-dashboard-main">
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading leave data...</div>
        ) : (
          <>
            {/* Employee Profile Section */}
           {/* Welcome Card */}
          <section className="section-box employee-summary-card">
            <div className="employee-header">
              <div>
                <h2>Welcome Back 👋</h2>
                <p>Manage your leave requests and balances</p>
              </div>

              <div className="employee-meta">
                <span>Employee ID</span>
                <strong>{userId}</strong>
              </div>
            </div>
          </section>

          {/* Navigation Buttons */}
          <section className="section-box">
            <div className="profile-actions">
              <button
                className={`action-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>

              <button
                className={`action-btn ${activeTab === 'apply-leave' ? 'active' : ''}`}
                onClick={() => setActiveTab('apply-leave')}
              >
                Apply Leave
              </button>

              <button
                className="action-btn"
                onClick={() => navigate('/employee/leaves/monthly-report')}
              >
                Monthly Report
              </button>
            </div>
          </section>
            {/* Leave Balance Cards */}
            {Object.keys(balances).length > 0 && (
              <LeaveBalances balances={balances} />
            )}

            {/* Content Section - Changes based on active tab */}
            {activeTab === 'dashboard' && (
              <>
               <div className="leave-stats-grid">

                <div className="stat-card">
                  <h3>Available Leaves</h3>
                  <span>
                    {Array.isArray(balances)
                      ? balances.reduce((total, item) => total + (item.balance || 0), 0)
                      : 0}
                  </span>
                </div>

                <div className="stat-card">
                  <h3>Approved</h3>
                  <span>
                    {requests.filter(r => r.status === 'Approved').length}
                  </span>
                </div>

                <div className="stat-card">
                  <h3>Pending</h3>
                  <span>
                    {requests.filter(r => r.status === 'Pending').length}
                  </span>
                </div>

                <div className="stat-card">
                  <h3>Used Leaves</h3>
                  <span>
                    {requests
                      .filter(r => r.status === 'Approved')
                      .reduce((sum, r) => sum + (r.days || 0), 0)}
                  </span>
                </div>

              </div>
                
                {/* My Leave Requests Table */}
              <EmployeeRequestTable requests={requests} />
              </>
            )}

            {activeTab === 'apply-leave' && (
              <>
                {/* Apply Leave Request Form */}
                <LeaveRequestForm 
                  formData={formData}
                  onChange={handleFormChange}
                  onSubmit={handleSubmit}
                />

                {/* My Leave Requests Table */}
                <EmployeeRequestTable requests={requests} />
              </>
            )}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default EmployeeLeaveRequestPage;
