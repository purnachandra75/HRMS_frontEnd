import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Calendar, Power, PowerOff, Users } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import StatusBadge from './components/StatusBadge';
import { getClient, getClientEmployees, updateClientStatus } from '../../services/superAdminService';

export default function SuperAdminClientDetail({ userName, onLogout }) {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadClient = useCallback(() => {
    getClient(id)
      .then(setClient)
      .catch(() => setError('Failed to load client'));
  }, [id]);

  useEffect(() => {
    loadClient();
    getClientEmployees(id, 0, 50)
      .then((data) => setEmployees(data.content || []))
      .catch(() => setError('Failed to load client'));
  }, [id, loadClient]);

  const toggleStatus = async () => {
    if (!client) return;
    const nextStatus = client.status === 'Active' ? 'Disabled' : 'Active';
    setActionError('');
    try {
      await updateClientStatus(client.id, nextStatus);
      loadClient();
    } catch {
      setActionError('Failed to update client status');
    }
  };

  const initials = client?.companyName
    ? client.companyName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '—';

  return (
    <SuperAdminLayout userName={userName} onLogout={onLogout}>
      <div className="flex flex-col gap-6">
        <Link to="/super-admin/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          All clients
        </Link>

        {(error || actionError) && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error || actionError}
          </div>
        )}

        {client && (
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="relative overflow-hidden border-b border-border/80 bg-gradient-to-br from-primary/15 via-card to-sky-500/10 px-5 py-6 sm:px-7">
              <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-md">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">{client.companyName}</h1>
                    <div className="mt-1">
                      <StatusBadge status={client.status} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.status === 'Active' ? (
                    <button
                      onClick={toggleStatus}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive/10 px-3 text-sm font-medium text-destructive hover:bg-destructive/20"
                    >
                      <PowerOff className="size-4" />
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={toggleStatus}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      <Power className="size-4" />
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              <DetailCell icon={Mail} label="Contact email" value={client.contactEmail || '—'} />
              <DetailCell icon={Phone} label="Contact phone" value={client.contactPhone || '—'} />
              <DetailCell
                icon={Calendar}
                label="Registered"
                value={client.createdAt ? new Date(client.createdAt).toLocaleString() : '—'}
              />
              <DetailCell icon={Users} label="Employees" value={client.employeeCount} />
              <DetailCell icon={Building2} label="Client ID" value={client.id} />
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Employees</h2>
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 480 }}>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    {['Name', 'Email', 'Role'].map((col) => (
                      <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No employees yet.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.empId} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{emp.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{emp.email}</td>
                        <td className="px-4 py-3 text-sm capitalize text-muted-foreground">{emp.role}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function DetailCell({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 bg-card px-5 py-4">
      <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
        <div className="mt-1.5 text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}
