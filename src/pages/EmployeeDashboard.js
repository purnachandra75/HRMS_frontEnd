import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, CheckSquare, CalendarDays, NotebookPen, FileText } from 'lucide-react';
import EmployeeLayout from '../components/EmployeeLayout';
import '../styles/tailwind.css';

const CARDS = [
  {
    key: 'profile',
    icon: UserCircle,
    title: 'View/Edit My Profile',
    description: 'Manage your personal and professional information.',
    path: '/employee/profile',
  },
  {
    key: 'attendance',
    icon: CheckSquare,
    title: 'Attendance Records',
    description: 'Track your daily attendance and work hours.',
    path: '/employee/attendance',
  },
  {
    key: 'leaves',
    icon: CalendarDays,
    title: 'Leave Requests',
    description: 'Submit, track, and manage your leave requests.',
    path: '/employee/leaves',
  },
  {
    key: 'timesheet',
    icon: NotebookPen,
    title: 'Daily Timesheet',
    description: "Log today's work - routed to your PM if you're on a project, or HR if you're on bench.",
    path: '/employee/timesheet',
  },
  {
    key: 'payslip',
    icon: FileText,
    title: 'Payslip',
    description: 'Generate your payslip after payroll amount is credited.',
    path: '/employee/payslip',
  },
];

const WHAT_YOU_CAN_DO = [
  'View your profile information',
  'Edit your personal details',
  'Check in and check out',
  'View your attendance records',
  'Submit leave requests',
  'Track your work hours',
  'Generate your credited payroll payslip',
];

function EmployeeDashboard({ userName, userId, onLogout }) {
  const navigate = useNavigate();

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="dashboard"
      title="Employee Dashboard"
      subtitle="Quick access to your profile, attendance records, and leave requests."
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                onClick={() => navigate(card.path)}
                className="flex flex-col items-start gap-3 rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-employee/10 text-employee">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">What can you do?</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {WHAT_YOU_CAN_DO.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-employee" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </EmployeeLayout>
  );
}

export default EmployeeDashboard;
