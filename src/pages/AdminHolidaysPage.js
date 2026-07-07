import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { getAllYears, getHolidays, createHoliday, deleteHoliday } from '../services/holidayService';
import AdminLayout from '../components/AdminLayout';

function AdminHolidaysPage({ userName, onLogout }) {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', title: '', description: '' });

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

  useEffect(() => {
    loadHolidays();
  }, [year]);

  const loadHolidays = async () => {
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
  };

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
    } catch (err) {
      console.error('Failed to delete holiday', err);
      alert(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <AdminLayout userName={userName} onLogout={onLogout} activeItem="holidays" title={`Holidays for ${year}`} subtitle="Declare company holidays for a year. Employees will see this calendar in their dashboard.">

          <div className="report-controls-top">
            <div>
              <label>Year:</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {Array.from(new Set([new Date().getFullYear(), ...(years || [])])).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ padding: '16px' }}>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                  <button className="create-btn" type="submit">Add Holiday</button>
                </div>
              </div>
            </form>

            <div style={{ marginTop: '16px' }}>
              {loading ? (
                <p>Loading...</p>
              ) : holidays.length === 0 ? (
                <p>No holidays declared for this year.</p>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr><th>Date</th><th>Title</th><th>Description</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {holidays.map((h) => (
                      <tr key={h.id}>
                        <td>{new Date(h.date).toLocaleDateString()}</td>
                        <td>{h.title}</td>
                        <td>{h.description}</td>
                        <td><button className="small-button reject" onClick={() => handleDelete(h.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
    </AdminLayout>
  );
}

export default AdminHolidaysPage;
