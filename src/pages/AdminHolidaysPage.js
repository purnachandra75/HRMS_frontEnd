import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import '../styles/tailwind.css';
import { getAllYears, getHolidays, createHoliday, deleteHoliday } from '../services/holidayService';
import AdminLayout from '../components/AdminLayout';
import HolidayCalendar from '../components/HolidayCalendar';

function AdminHolidaysPage({ userName, onLogout }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', title: '', description: '' });
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  useEffect(() => {
    const loadYears = async () => {
      try {
        const data = await getAllYears();
        setYears(data.length ? data : [new Date().getFullYear()]);
      } catch (err) {
        console.error('Failed to load holiday years', err);
        setYears([new Date().getFullYear()]);
      }
    };
    loadYears();
  }, []);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHolidays(year);
      setHolidays(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      console.error(err);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.title) {
      alert('Please enter date and title');
      return;
    }

    try {
      const created = await createHoliday({ date: form.date, title: form.title, description: form.description });
      setHolidays((s) => [...s, created].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setYears((s) => Array.from(new Set([...s, new Date(form.date).getFullYear()])));
      setForm({ date: '', title: '', description: '' });
      setCalendarRefreshKey((k) => k + 1);
      alert('Holiday added');
    } catch (err) {
      console.error('Failed to add holiday', err);
      alert(err?.response?.data?.message || err.message || 'Failed to add holiday');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await deleteHoliday(id);
      setHolidays((s) => s.filter((h) => String(h.id) !== String(id)));
      setCalendarRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to delete holiday', err);
      alert(err?.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <AdminLayout userName={userName} onLogout={onLogout} activeItem="holidays" title={`Holidays for ${year}`} subtitle="Declare company holidays for a year. Employees will see this calendar in their dashboard.">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
          >
            {Array.from(new Set([new Date().getFullYear(), ...(years || [])])).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <HolidayCalendar refreshKey={calendarRefreshKey} />

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-client px-3 text-sm font-medium text-client-foreground hover:bg-client/90"
            >
              <Plus className="size-4" />
              Add Holiday
            </button>
          </form>

          <div className="mt-5">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : holidays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No holidays declared for this year.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 500 }}>
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40">
                        {['Date', 'Title', 'Description', 'Action'].map((col) => (
                          <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map((h) => (
                        <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm text-foreground">{new Date(h.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{h.title}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{h.description}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDelete(h.id)}
                              className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminHolidaysPage;
