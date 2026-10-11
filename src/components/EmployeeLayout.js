import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  UserCircle,
  CheckSquare,
  CalendarDays,
  Compass,
  NotebookPen,
  PartyPopper,
  BarChart3,
  FileText,
  Ticket,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import useIsProjectManager from '../hooks/useIsProjectManager';
import useTheme from '../hooks/useTheme';
import CompanyBrand from './CompanyBrand';
import usePolledCount from '../hooks/usePolledCount';
import { getMyTickets, getUpdatedTicketIds, TICKETS_CHANGED_EVENT } from '../services/ticketService';
import {
  getEmployeeLeaveRequestsForBadge,
  getUpdatedLeaveIds,
  LEAVES_CHANGED_EVENT,
} from '../services/leaveService';
import '../styles/tailwind.css';

const SIDEBAR_COLLAPSED_KEY = 'employee-sidebar-collapsed';

// The layout isn't passed the user id, so read it from the session App.js stores at login.
const getLoggedInEmployeeId = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))?.id ?? null;
  } catch {
    return null;
  }
};

const fetchUpdatedTicketCount = async () => {
  const tickets = await getMyTickets();
  return getUpdatedTicketIds(Array.isArray(tickets) ? tickets : []).length;
};

const fetchUpdatedLeaveCount = async () => {
  const employeeId = getLoggedInEmployeeId();
  if (!employeeId) return 0;
  return getUpdatedLeaveIds(await getEmployeeLeaveRequestsForBadge(employeeId)).length;
};

function NavButton({ icon: Icon, label, active, collapsed, onClick, badge = 0 }) {
  const badgeText = badge > 99 ? '99+' : String(badge);
  return (
    <button
      type="button"
      title={badge > 0 ? `${label} (${badge} updated)` : label}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-employee-sidebar-accent text-white'
          : 'text-employee-sidebar-muted hover:bg-employee-sidebar-accent/60 hover:text-white'
      }`}
    >
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {collapsed && badge > 0 && (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500 ring-2 ring-employee-sidebar" />
        )}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-none text-white">
          {badgeText}
        </span>
      )}
    </button>
  );
}

function EmployeeLayout({ userName, onLogout, activeItem, title, subtitle, children }) {
  const navigate = useNavigate();
  const isProjectManager = useIsProjectManager();
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
  // Sidebar badges: tickets and leave requests whose status the admin changed since last viewed.
  const updatedTicketCount = usePolledCount(fetchUpdatedTicketCount, TICKETS_CHANGED_EVENT);
  const updatedLeaveCount = usePolledCount(fetchUpdatedLeaveCount, LEAVES_CHANGED_EVENT);

  const handleLogout = () => {
    if (typeof onLogout === 'function') onLogout();
    navigate('/login');
  };

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

  const firstName = (userName || '').trim().split(/\s+/)[0];
  const initials = (firstName || 'E').charAt(0).toUpperCase();

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-employee-sidebar text-employee-sidebar-foreground transition-transform sm:static sm:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'sm:w-16' : 'sm:w-56'} w-56`}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">HR</div>
            {!collapsed && (
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight">HRMS</div>
                <div className="text-xs text-employee-sidebar-muted">Employee Portal</div>
              </div>
            )}
            <button className="text-employee-sidebar-muted sm:hidden" onClick={() => setMobileOpen(false)}>
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
            <NavButton icon={Home} label="Overview" active={activeItem === 'dashboard'} collapsed={collapsed} onClick={() => go('/employee')} />
            <NavButton icon={UserCircle} label="My Profile" active={activeItem === 'profile'} collapsed={collapsed} onClick={() => go('/employee/profile')} />
            <NavButton icon={CheckSquare} label="Attendance" active={activeItem === 'attendance'} collapsed={collapsed} onClick={() => go('/employee/attendance')} />
            <NavButton icon={CalendarDays} label="Leave Requests" active={activeItem === 'leaves'} collapsed={collapsed} onClick={() => go('/employee/leaves')} badge={updatedLeaveCount} />
            {isProjectManager && (
              <NavButton icon={Compass} label="My Team" active={activeItem === 'my-team'} collapsed={collapsed} onClick={() => go('/employee/my-team')} />
            )}
            <NavButton icon={NotebookPen} label="Daily Timesheet" active={activeItem === 'timesheet'} collapsed={collapsed} onClick={() => go('/employee/timesheet')} />
            <NavButton icon={PartyPopper} label="Holidays" active={activeItem === 'holidays'} collapsed={collapsed} onClick={() => go('/employee/holidays')} />
            <NavButton icon={Ticket} label="Raise Ticket" active={activeItem === 'tickets'} collapsed={collapsed} onClick={() => go('/employee/tickets')} badge={updatedTicketCount} />

            <hr className="my-2 border-white/10" />

            <NavButton icon={BarChart3} label="Monthly Leave Report" active={activeItem === 'monthly-report'} collapsed={collapsed} onClick={() => go('/employee/leaves/monthly-report')} />
            <NavButton icon={FileText} label="Payslip" active={activeItem === 'payslip'} collapsed={collapsed} onClick={() => go('/employee/payslip')} />
          </nav>

          <div className="border-t border-white/10 px-2 py-2">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-employee-sidebar-muted hover:bg-employee-sidebar-accent/60 hover:text-white sm:flex"
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              {!collapsed && 'Collapse'}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button className="text-foreground sm:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="size-5" />
              </button>
              <CompanyBrand fallbackTitle="Employee Portal" />
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-2.5 pl-1"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-employee text-xs font-semibold text-employee-foreground">
                  {initials}
                </span>
                <span className="hidden text-sm font-medium text-foreground sm:inline">{firstName}</span>
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

export default EmployeeLayout;
