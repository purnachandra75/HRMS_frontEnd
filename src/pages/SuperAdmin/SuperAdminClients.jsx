import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Power, PowerOff, Eye } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import StatusBadge from './components/StatusBadge';
import CreateClientDrawer from './components/CreateClientDrawer';
import { getClients, updateClientStatus } from '../../services/superAdminService';

export default function SuperAdminClients({ userName, onLogout }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    getClients()
      .then((data) => {
        setClients(data);
        setError('');
      })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (client) => {
    const nextStatus = client.status === 'Active' ? 'Disabled' : 'Active';
    try {
      await updateClientStatus(client.id, nextStatus);
      load();
    } catch {
      setError('Failed to update client status');
    }
  };

  return (
    <SuperAdminLayout userName={userName} onLogout={onLogout}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Clients</h1>
            <p className="mt-1 text-sm text-muted-foreground">Companies using this HRMS, each with fully isolated data.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Add client
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 720 }}>
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  {['Company', 'Contact', 'Employees', 'Status', 'Registered', ''].map((col) => (
                    <th
                      key={col}
                      className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No clients yet. Add the first one to get started.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => navigate(`/super-admin/clients/${client.id}`)}
                          className="font-medium text-primary hover:underline"
                        >
                          {client.companyName}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{client.contactEmail || '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-foreground">{client.employeeCount}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/super-admin/clients/${client.id}`)}
                            title="View detail"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(client)}
                            title={client.status === 'Active' ? 'Disable' : 'Activate'}
                            className={`rounded-md p-1.5 hover:bg-muted ${
                              client.status === 'Active' ? 'text-red-600' : 'text-emerald-600'
                            }`}
                          >
                            {client.status === 'Active' ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateClientDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onCreated={load} />
    </SuperAdminLayout>
  );
}
