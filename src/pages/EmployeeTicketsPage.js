import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Plus, X } from 'lucide-react';
import EmployeeLayout from '../components/EmployeeLayout';
import { getMyTickets, createTicket, getUpdatedTicketIds, markTicketsSeen } from '../services/ticketService';
import '../styles/tailwind.css';

const STATUS_CLASSES = {
  open: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  'in progress': 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  resolved: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  rejected: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

const TICKETS_PER_PAGE = 10;

function EmployeeTicketsPage({ userName, userId, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ subject: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [updatedIds, setUpdatedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyTickets();
      const list = Array.isArray(data) ? data : [];
      setTickets(list);
      // Highlight what changed on this visit, then mark it seen so the sidebar badge clears.
      setUpdatedIds(getUpdatedTicketIds(list));
      markTicketsSeen(list);
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

  const totalPages = Math.max(1, Math.ceil(tickets.length / TICKETS_PER_PAGE));
  // Clamp in case the list shrank after a reload.
  const safePage = Math.min(currentPage, totalPages);
  const pageTickets = tickets.slice((safePage - 1) * TICKETS_PER_PAGE, safePage * TICKETS_PER_PAGE);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('Please fill in both the subject and description');
      return;
    }

    setSubmitting(true);
    try {
      const newTicket = await createTicket(formData);
      setTickets((current) => [newTicket, ...current]);
      // Newest ticket is first, so jump back to page 1 to show it.
      setCurrentPage(1);
      setFormData({ subject: '', description: '' });
      setShowForm(false);
      alert('Ticket raised successfully! Your HR admin has been notified.');
    } catch (err) {
      console.error('Failed to raise ticket:', err);
      alert(err.message || 'Failed to raise ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeForm = () => {
    if (submitting) return;
    setShowForm(false);
    setFormData({ subject: '', description: '' });
  };

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="tickets"
      title="Raise a Ticket"
      subtitle="Send a request or report an issue to your HR admin."
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
        )}

        <section className="rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">My Tickets</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Track the status of tickets you've raised.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadTickets}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-employee px-3 py-1.5 text-sm font-medium text-employee-foreground hover:opacity-90"
              >
                <Plus className="size-3.5" />
                Raise Ticket
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">No tickets raised yet.</div>
          ) : (
            <>
            <ul className="divide-y divide-border/60">
              {pageTickets.map((ticket) => {
                const statusKey = (ticket.status || '').toLowerCase();
                return (
                  <li key={ticket.id} className="flex flex-col gap-2 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {ticket.subject}
                        {updatedIds.includes(ticket.id) && (
                          <span className="inline-flex h-5 items-center rounded-full bg-red-500 px-2 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Updated
                          </span>
                        )}
                      </h3>
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                          STATUS_CLASSES[statusKey] || 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{ticket.description}</p>
                    <div className="text-xs text-muted-foreground">Raised on {ticket.createdAt}</div>
                    {ticket.adminResponse && (
                      <div className="mt-1 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                        <span className="font-medium">HR Response: </span>
                        {ticket.adminResponse}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 px-5 py-3">
                <span className="text-sm text-muted-foreground">
                  Showing {(safePage - 1) * TICKETS_PER_PAGE + 1}-{Math.min(safePage * TICKETS_PER_PAGE, tickets.length)} of {tickets.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="h-8 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="h-8 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </section>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeForm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg flex-col gap-4 rounded-xl border border-border/80 bg-card p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Raise a Ticket</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Fill in the details below and submit your request to HR.
                </p>
              </div>
              <button
                onClick={closeForm}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ticket-subject" className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <input
                  id="ticket-subject"
                  type="text"
                  maxLength={200}
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief summary of your request"
                  autoFocus
                  className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ticket-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="ticket-description"
                  rows={5}
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your issue or request in detail"
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-employee px-4 py-2 text-sm font-medium text-employee-foreground disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}

export default EmployeeTicketsPage;
