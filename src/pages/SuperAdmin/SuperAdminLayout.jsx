import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, LogOut, ChevronDown, Menu, X, Sun, Moon } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import '../../styles/tailwind.css';
import './superadmin.css';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/super-admin/clients', icon: Building2 },
];

export default function SuperAdminLayout({ userName, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (typeof onLogout === 'function') onLogout();
    navigate('/super-admin/login');
  };

  const initials = (userName || 'SA')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="super-admin-root">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-52 flex-col bg-sidebar text-sidebar-foreground transition-transform sm:static sm:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">HR</div>
            <div className="flex-1">
              <div className="text-sm font-semibold leading-tight">HRMS Platform</div>
              <div className="text-xs text-sidebar-muted">Super Admin</div>
            </div>
            <button className="text-sidebar-muted sm:hidden" onClick={() => setMobileOpen(false)}>
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sidebar-accent text-white'
                      : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-white'
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
            <button className="text-foreground sm:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </button>
            <div className="hidden sm:block" />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-2.5 pl-1"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </span>
                <span className="text-sm font-medium text-foreground">{userName || 'Super Admin'}</span>
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

          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
