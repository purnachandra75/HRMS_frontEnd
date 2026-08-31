import React from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import LeaveReportCard from '../components/LeaveReportCard';
import '../styles/tailwind.css';

function MonthlyLeaveReportPage({ userName, userId, onLogout }) {
  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="monthly-report"
      title="Monthly Leave Report"
      subtitle="View your yearly leave usage and monthly breakdown."
    >
      <LeaveReportCard userId={userId} />
    </EmployeeLayout>
  );
}

export default MonthlyLeaveReportPage;
