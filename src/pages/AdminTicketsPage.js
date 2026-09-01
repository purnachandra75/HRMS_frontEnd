import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getClientTickets, updateTicketStatus } from '../services/ticketService';
import '../styles/tailwind.css';

const STATUS_OPTIONS = ['all', 'Open', 'In Progress', 'Resolved', 'Rejected'];

const STATUS_CLASSES = {
  open: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  'in progress': 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  resolved: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  rejected: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

function AdminTicketsPage({ userName, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [drafts, setDrafts] = useState({}); // ticketId -> { status, adminResponse }
  const [savingId, setSavingId] = useState(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientTickets();
      setTickets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter((t) => (t.status || '').toLowerCase() === statusFilter.toLowerCase());
  }, [tickets, statusFilter]);

  const draftFor = (ticket) =>
    drafts[ticket.id] || { status: ticket.status, adminResponse: ticket.adminResponse || '' };

  const setDraft = (ticketId, patch) => {
    setDrafts((prev) => ({ ...prev, [ticketId]: { ...draftFor({ id: ticketId, ...prev[ticketId] }), ...patch } }));
  };

  const handleSave = async (ticket) => {
    const draft = draftFor(ticket);
    setSavingId(ticket.id);
    try {
      const updated = await updateTicketStatus(ticket.id, draft);
      setTickets((current) => current.map((t) => (t.id === updated.id ? updated : t)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[ticket.id];
        return next;
      });
    } catch (err) {
      console.error('Failed to update ticket:', err);
      alert(err.message || 'Failed to update ticket');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="tickets"
      title="Tickets"
      subtitle="Review and respond to tickets raised by your employees."
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
        )}

        <section className="rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Employee Tickets</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Update status and add a response for each ticket.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="ticket-status-filter" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="ticket-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Statuses' : option}
                  </option>
                ))}
              </select>
              <button
                onClick={loadTickets}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">No tickets found.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filteredTickets.map((ticket) => {
                const statusKey = (ticket.status || '').toLowerCase();
                const draft = draftFor(ticket);
                const isDirty =
                  draft.status !== ticket.status || (draft.adminResponse || '') !== (ticket.adminResponse || '');
                return (
                  <li key={ticket.id} className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{ticket.subject}</h3>
                        <div className="text-xs text-muted-foreground">
                          {ticket.employeeName} (ID: {ticket.empId}) &middot; {ticket.createdAt}
                        </div>
                      </div>
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                          STATUS_CLASSES[statusKey] || 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>

                    <div className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/40 p-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Status</label>
                        <select
                          value={draft.status}
                          onChange={(e) => setDraft(ticket.id, { status: e.target.value })}
                          className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                        >
                          {STATUS_OPTIONS.filter((s) => s !== 'all').map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">Response note</label>
                        <input
                          type="text"
                          maxLength={2000}
                          value={draft.adminResponse}
                          onChange={(e) => setDraft(ticket.id, { adminResponse: e.target.value })}
                          placeholder="Optional note to the employee"
                          className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                        />
                      </div>
                      <button
                        onClick={() => handleSave(ticket)}
                        disabled={!isDirty || savingId === ticket.id}
                        className="h-9 rounded-lg bg-client px-3.5 text-sm font-medium text-client-foreground disabled:opacity-50"
                      >
                        {savingId === ticket.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminTicketsPage;
