import React from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import LeaveReportCard from '../components/LeaveReportCard';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

function MonthlyLeaveReportPage({ userName, userId, onLogout }) {
  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="monthly-report"
      title="Monthly Leave Report"
      subtitle="View your yearly leave usage and monthly breakdown."
    >
      <div className="dashboard-main employee-dashboard-main">
        <LeaveReportCard userId={userId} />
      </div>
    </EmployeeLayout>
  );
}

export default MonthlyLeaveReportPage;
