import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from './SuperAdminLayout';
import StatTile from './components/StatTile';
import { getDashboardStats } from '../../services/superAdminService';

export default function SuperAdminDashboard({ userName, onLogout }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard stats'));
  }, []);

  return (
    <SuperAdminLayout userName={userName} onLogout={onLogout}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform-wide overview of client companies.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total Clients" value={stats?.totalClients ?? '—'} />
          <StatTile label="Active Clients" value={stats?.activeClients ?? '—'} tone="good" />
          <StatTile label="Disabled Clients" value={stats?.disabledClients ?? '—'} tone="bad" />
          <StatTile label="Total Employees" value={stats?.totalEmployees ?? '—'} tone="default" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/super-admin/clients')}
            className="h-9 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Manage Clients
          </button>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
