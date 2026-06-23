import React, { useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import HolidayCalendar from '../components/HolidayCalendar';
import { getHolidays, getAllYears } from '../services/holidayService';

function EmployeeHolidaysPage({ userId, userName, onLogout }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const load = async () => {
      setLoading(true);
      try {
        const data = await getHolidays(year);
        setHolidays(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
      } catch (err) {
        console.error('Failed to load holidays', err);
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  return (
    <EmployeeLayout userName={userName} onLogout={onLogout} activeItem="holidays" title="Holidays" subtitle={`Company holidays for ${year}`}>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label>Year: </label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from(new Set([new Date().getFullYear(), ...(years || [])])).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading holidays...</p>
        ) : (
          <HolidayCalendar year={year} holidays={holidays} />
        )}
      </div>
    </EmployeeLayout>
  );
}

export default EmployeeHolidaysPage;
