import React from 'react';
import { useNavigate } from 'react-router-dom';

function AdminSidebar({ activeItem }) {
  const navigate = useNavigate();

  const items = [
    ['employees', 'Employee Details', '/admin'],
    ['leaves', 'Leave Management', '/admin/leaves'],
    ['reports', 'Reports', '/admin/reports'],
    ['attendance', 'Attendance', '/admin/attendance'],
    ['payroll', 'Payroll', '/admin/payroll'],
    ['payslip', 'Payslip Generator', '/admin/pf-generator'],
    ['essentials', 'Essentials', '/admin/essentials'],
  ];

  return (
    <aside className="reports-sidebar">
      <h2>Dashboard</h2>
      <nav>
        {items.map(([key, label, path]) => (
          <button
            key={key}
            type="button"
            className={activeItem === key ? 'active' : ''}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
        <hr className="reports-sidebar-divider" />
        <button type="button" onClick={() => navigate('/admin/employee/new')}>
          + Create Employee
        </button>
      </nav>
    </aside>
  );
}

export default AdminSidebar;
