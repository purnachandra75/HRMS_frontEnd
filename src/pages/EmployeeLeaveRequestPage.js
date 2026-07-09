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
import { calculateDaysBetween, getTotalLeaveBalance, normalizeLeaveBalances } from '../utils/leaveUtils';
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

  useEffect(() => {
    // Refresh balances periodically to ensure they stay in sync with approvals
    const balanceRefreshInterval = setInterval(() => {
      if (userId) {
        getLeaveBalances(userId).then((balancesData) => {
          setBalances(normalizeLeaveBalances(balancesData));
        }).catch((err) => {
          console.error('Failed to refresh leave balances:', err);
        });
      }
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(balanceRefreshInterval);
  }, [userId]);

  const loadEmployeeData = async () => {
    setLoading(true);
    let requestsData = [];
    let balancesData = {};
    let loadError = '';

    try {
      requestsData = await getEmployeeLeaveRequests(userId);
    } catch (requestError) {
      console.error('Failed to load leave requests:', requestError);
      loadError = 'Unable to load leave requests. Default leave balances are shown.';
    }

    try {
      balancesData = await getLeaveBalances(userId);
    } catch (balanceError) {
      console.error('Failed to load leave balances:', balanceError);
    }

    // Sort by createdAt in descending order (newest first)
    const requestsArray = Array.isArray(requestsData) ? requestsData : [];
    const sortedRequests = requestsArray.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.id).getTime();
      const dateB = new Date(b.createdAt || b.id).getTime();
      return dateB - dateA;
    });

    setRequests(sortedRequests);
    setBalances(normalizeLeaveBalances(balancesData));
    setError(loadError || null);
    setLoading(false);
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
      setRequests([newRequest, ...requests]);
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

              <button
                className="action-btn"
                onClick={() => loadEmployeeData()}
              >
                🔄 Refresh
              </button>
            </div>
          </section>
            {/* Leave Balance Cards - Always Display */}
            {Object.keys(balances).length > 0 ? (
              <LeaveBalances balances={balances} />
            ) : (
              <section className="section-box">
                <div className="cards-row">
                  <div className="info-card"><span>Casual Leaves</span><strong>0</strong></div>
                  <div className="info-card"><span>Sick Leaves</span><strong>0</strong></div>
                  <div className="info-card"><span>Paid Leaves</span><strong>0</strong></div>
                </div>
              </section>
            )}

            {/* Content Section - Changes based on active tab */}
            {activeTab === 'dashboard' && (
              <>
               <div className="leave-stats-grid">

                <div className="stat-card">
                  <h3>Available Leaves</h3>
                  <span>{getTotalLeaveBalance(balances)}</span>
                </div>

                <div className="stat-card">
                  <h3>Approved</h3>
                  <span>
                    {requests.filter(r => (r.status || '').toLowerCase() === 'approved').length}
                  </span>
                </div>

                <div className="stat-card">
                  <h3>Pending</h3>
                  <span>
                    {requests.filter(r => (r.status || '').toLowerCase() === 'pending').length}
                  </span>
                </div>

                <div className="stat-card">
                  <h3>Used Leaves</h3>
                  <span>
                    {requests
                      .filter(r => (r.status || '').toLowerCase() === 'approved')
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
