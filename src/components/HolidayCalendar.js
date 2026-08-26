import React, { useEffect, useMemo, useState } from 'react';
import { getHolidays } from '../services/holidayService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (n) => String(n).padStart(2, '0');
const toISODate = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

// Self-contained Google-Calendar-style month grid: fetches its own data (one request per year,
// re-used across that year's months) and manages its own prev/next/today navigation, so any page
// can just drop in <HolidayCalendar /> without wiring up year state itself.
export default function HolidayCalendar({ refreshKey = 0 } = {}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHolidays(year)
      .then((data) => { if (!cancelled) setHolidays(data || []); })
      .catch(() => { if (!cancelled) setHolidays([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, refreshKey]);

  const holidaysByDate = useMemo(() => {
    const map = {};
    holidays.forEach((h) => { map[h.date] = h; });
    return map;
  }, [holidays]);

  const goPrevMonth = () => {
    setSelectedDate(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else { setMonth((m) => m - 1); }
  };
  const goNextMonth = () => {
    setSelectedDate(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else { setMonth((m) => m + 1); }
  };
  const goToday = () => {
    setSelectedDate(null);
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const startWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: daysInPrevMonth - startWeekday + 1 + i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, iso: toISODate(year, month, d) });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing++, inMonth: false });
  }

  const todayIso = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedHoliday = selectedDate ? holidaysByDate[selectedDate] : null;

  return (
    <div className="holiday-calendar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button type="button" className="small-button" onClick={goPrevMonth}>‹ Prev</button>
        <h3 style={{ margin: 0 }}>{MONTH_NAMES[month]} {year}</h3>
        <div>
          <button type="button" className="small-button" onClick={goToday} style={{ marginRight: '8px' }}>Today</button>
          <button type="button" className="small-button" onClick={goNextMonth}>Next ›</button>
        </div>
      </div>

      {loading ? (
        <p>Loading calendar...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '4px',
                  color: (i === 0 || i === 6) ? '#dc2626' : '#475569',
                }}
              >
                {d}
              </div>
            ))}
            {cells.map((cell, idx) => {
              const weekdayIndex = idx % 7;
              const isWeekend = weekdayIndex === 0 || weekdayIndex === 6;
              const holiday = cell.iso ? holidaysByDate[cell.iso] : null;
              const isHoliday = Boolean(holiday);
              const isToday = cell.iso === todayIso;
              const isSelected = cell.iso && cell.iso === selectedDate;
              const isRed = cell.inMonth && (isHoliday || isWeekend);

              return (
                <div
                  key={idx}
                  onClick={() => cell.inMonth && isHoliday && setSelectedDate(cell.iso)}
                  title={holiday ? holiday.title : undefined}
                  style={{
                    minHeight: '64px',
                    padding: '6px',
                    borderRadius: '6px',
                    border: isToday ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                    outline: isSelected ? '2px solid #4f46e5' : 'none',
                    background: !cell.inMonth ? '#f8fafc' : isHoliday ? '#fee2e2' : '#fff',
                    color: !cell.inMonth ? '#cbd5e1' : isRed ? '#dc2626' : '#1f2937',
                    cursor: cell.inMonth && isHoliday ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ fontWeight: isToday ? 700 : 500 }}>{cell.day}</div>
                  {isHoliday && (
                    <div
                      style={{
                        fontSize: '11px',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {holiday.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px' }}>
            {selectedHoliday ? (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                <strong>{selectedHoliday.title}</strong>
                {' - '}
                {new Date(selectedHoliday.date).toLocaleDateString(undefined, {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
                {selectedHoliday.description && (
                  <p style={{ margin: '6px 0 0', color: '#7f1d1d' }}>{selectedHoliday.description}</p>
                )}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                Click a highlighted date to see the reason for the holiday.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
