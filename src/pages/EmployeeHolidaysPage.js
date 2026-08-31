import React from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import HolidayCalendar from '../components/HolidayCalendar';

function EmployeeHolidaysPage({ userName, onLogout }) {
  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="holidays"
      title="Holidays"
      subtitle="Company holidays and weekends - click a highlighted date for details."
    >
      <HolidayCalendar />
    </EmployeeLayout>
  );
}

export default EmployeeHolidaysPage;
