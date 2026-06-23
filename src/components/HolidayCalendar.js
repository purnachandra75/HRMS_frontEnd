import React from 'react';

function monthName(i) {
  return [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ][i];
}

export default function HolidayCalendar({ year, holidays = [] }) {
  const grouped = holidays.reduce((acc, h) => {
    const d = new Date(h.date);
    const m = d.getMonth();
    acc[m] = acc[m] || [];
    acc[m].push(h);
    return acc;
  }, {});

  return (
    <div className="holiday-calendar">
      <h3>Holidays - {year}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {Array.from({ length: 12 }).map((_, m) => (
          <div key={m} className="holiday-month-card" style={{ border: '1px solid #e5e7eb', padding: '8px', borderRadius: '6px' }}>
            <h4 style={{ marginTop: 0 }}>{monthName(m)}</h4>
            {grouped[m] && grouped[m].length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {grouped[m].map((h) => (
                  <li key={h.id} style={{ marginBottom: '6px' }}>
                    <strong>{new Date(h.date).getDate()}</strong>: {h.title}
                    {h.description ? (<div style={{ fontSize: '12px', color: '#6b7280' }}>{h.description}</div>) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#9ca3af' }}>No holidays</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
