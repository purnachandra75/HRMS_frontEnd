import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  BarChart3,
  PartyPopper,
  CheckSquare,
  Compass,
  NotebookPen,
  Wallet,
  FileBarChart,
  Wrench,
  Ticket,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import useTheme from '../hooks/useTheme';
import '../styles/tailwind.css';

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

const EMPLOYEE_REPORT_ITEMS = [
  { type: 'all', label: 'All Employees' },
  { type: 'status', label: 'Employee Exit Report' },
  { type: 'employment', label: 'Employment Type Report' },
  { type: 'newJoiners', label: 'New Joiners' },
  { type: 'probation', label: 'Probation Period' },
];

function NavButton({ icon: Icon, label, active, collapsed, onClick }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-client-sidebar-accent text-white'
          : 'text-client-sidebar-muted hover:bg-client-sidebar-accent/60 hover:text-white'
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export default function AdminLayout({ userName, onLogout, activeItem, title, subtitle, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const [reportsOpen, setReportsOpen] = useState(activeItem === 'reports');
  const [employeeReportsOpen, setEmployeeReportsOpen] = useState(true);

  useEffect(() => {
    if (activeItem === 'reports') {
      setReportsOpen(true);
    }
  }, [activeItem]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // localStorage unavailable (private mode, etc.) - collapse still works for this session
      }
      return next;
    });
  };

  const handleLogout = () => {
    if (typeof onLogout === 'function') onLogout();
    navigate('/login');
  };

  const reportParams = new URLSearchParams(location.search);
  const currentReport = activeItem === 'reports' ? reportParams.get('report') || 'salary' : null;
  const currentReportType = activeItem === 'reports' ? reportParams.get('type') || '' : '';

  const isReportActive = (report, type) => currentReport === report && (!type || currentReportType === type);

  const initials = (userName || 'CA')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">HR</div>
        {!collapsed && (
          <div className="flex-1">
            <div className="text-sm font-semibold leading-tight">HRMS</div>
            <div className="text-xs text-client-sidebar-muted">Client Admin</div>
          </div>
        )}
        <button className="text-client-sidebar-muted sm:hidden" onClick={() => setMobileOpen(false)}>
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
        <NavButton icon={Users} label="Employee Details" active={activeItem === 'dashboard'} collapsed={collapsed} onClick={() => go('/admin')} />
        <NavButton icon={CalendarDays} label="Leave Management" active={activeItem === 'leaves'} collapsed={collapsed} onClick={() => go('/admin/leaves')} />

        <div>
          <div className="flex items-center">
            <button
              type="button"
              title="Reports"
              onClick={() => go('/admin/reports')}
              className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeItem === 'reports'
                  ? 'bg-client-sidebar-accent text-white'
                  : 'text-client-sidebar-muted hover:bg-client-sidebar-accent/60 hover:text-white'
              }`}
            >
              <BarChart3 className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">Reports</span>}
            </button>
            {!collapsed && (
              <button
                type="button"
                aria-label={reportsOpen ? 'Collapse report sections' : 'Expand report sections'}
                onClick={() => setReportsOpen((prev) => !prev)}
                className="rounded-md p-1.5 text-client-sidebar-muted hover:text-white"
              >
                <ChevronRight className={`size-3.5 transition-transform ${reportsOpen ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>

          {!collapsed && reportsOpen && (
            <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
              <button
                type="button"
                onClick={() => go('/admin/reports?report=salary')}
                className={`rounded-md px-2.5 py-1.5 text-left text-sm ${
                  isReportActive('salary') ? 'bg-client-sidebar-accent text-white' : 'text-client-sidebar-muted hover:text-white'
                }`}
              >
                Salary Report
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setEmployeeReportsOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm ${
                    isReportActive('employee') ? 'text-white' : 'text-client-sidebar-muted hover:text-white'
                  }`}
                >
                  <span>Employee Reports</span>
                  <ChevronRight className={`size-3.5 transition-transform ${employeeReportsOpen ? 'rotate-90' : ''}`} />
                </button>

                {employeeReportsOpen && (
                  <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {EMPLOYEE_REPORT_ITEMS.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => go(`/admin/reports?report=employee&type=${item.type}`)}
                        className={`rounded-md px-2.5 py-1.5 text-left text-sm ${
                          isReportActive('employee', item.type)
                            ? 'bg-client-sidebar-accent text-white'
                            : 'text-client-sidebar-muted hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => go('/admin/reports?report=leaves')}
                className={`rounded-md px-2.5 py-1.5 text-left text-sm ${
                  isReportActive('leaves') ? 'bg-client-sidebar-accent text-white' : 'text-client-sidebar-muted hover:text-white'
                }`}
              >
                Leave Report
              </button>

              <button
                type="button"
                onClick={() => go('/admin/reports?report=attendance')}
                className={`rounded-md px-2.5 py-1.5 text-left text-sm ${
                  isReportActive('attendance') ? 'bg-client-sidebar-accent text-white' : 'text-client-sidebar-muted hover:text-white'
                }`}
              >
                Attendance Report
              </button>
            </div>
          )}
        </div>

        <NavButton icon={PartyPopper} label="Holidays" active={activeItem === 'holidays'} collapsed={collapsed} onClick={() => go('/admin/holidays')} />
        <NavButton icon={CheckSquare} label="Attendance" active={activeItem === 'attendance'} collapsed={collapsed} onClick={() => go('/admin/attendance')} />
        <NavButton icon={Compass} label="Team Structure" active={activeItem === 'team-structure'} collapsed={collapsed} onClick={() => go('/admin/team-structure')} />
        <NavButton icon={NotebookPen} label="HR Timesheets" active={activeItem === 'timesheets'} collapsed={collapsed} onClick={() => go('/admin/timesheets')} />
        <NavButton icon={Wallet} label="Payroll" active={activeItem === 'payroll'} collapsed={collapsed} onClick={() => go('/admin/payroll')} />
        <NavButton icon={FileBarChart} label="Payroll Report" active={activeItem === 'payroll-report'} collapsed={collapsed} onClick={() => go('/admin/payroll-report')} />
        <NavButton icon={Wrench} label="Essentials" active={activeItem === 'essentials'} collapsed={collapsed} onClick={() => go('/admin/essentials')} />
        <NavButton icon={Ticket} label="Tickets" active={activeItem === 'tickets'} collapsed={collapsed} onClick={() => go('/admin/tickets')} />

        <hr className="my-2 border-white/10" />
        <NavButton icon={UserPlus} label="Create Employee" active={false} collapsed={collapsed} onClick={() => go('/admin/employee/new')} />
      </nav>

      <div className="border-t border-white/10 px-2 py-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-client-sidebar-muted hover:bg-client-sidebar-accent/60 hover:text-white sm:flex"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-client-sidebar text-client-sidebar-foreground transition-transform sm:static sm:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'sm:w-16' : 'sm:w-56'} w-56`}
        >
          {sidebarContent}
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button className="text-foreground sm:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="size-5" />
              </button>
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                {title || 'Client Admin Dashboard'}
              </h1>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-2.5 pl-1"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-client text-xs font-semibold text-client-foreground">
                  {initials}
                </span>
                <span className="hidden text-sm font-medium text-foreground sm:inline">{userName}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                    <button
                      onClick={toggleTheme}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                    >
                      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="size-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
            {(title || subtitle) && (
              <div className="mb-5">
                {title && <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>}
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
