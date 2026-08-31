import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getHolidays } from '../services/holidayService';
import '../styles/tailwind.css';

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
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <ChevronLeft className="size-4" />
          Prev
        </button>
        <h3 className="text-base font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading calendar...</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className={`p-1 text-center text-xs font-semibold ${i === 0 || i === 6 ? 'text-red-600' : 'text-muted-foreground'}`}
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
                  className={`min-h-16 rounded-md border p-1.5 ${
                    isToday ? 'border-2 border-client' : 'border-border'
                  } ${isSelected ? 'ring-2 ring-client' : ''} ${
                    !cell.inMonth ? 'bg-muted/40' : isHoliday ? 'bg-red-50' : 'bg-white'
                  } ${!cell.inMonth ? 'text-muted-foreground/50' : isRed ? 'text-red-600' : 'text-foreground'} ${
                    cell.inMonth && isHoliday ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className={isToday ? 'font-bold' : 'font-medium'}>{cell.day}</div>
                  {isHoliday && (
                    <div className="mt-1 truncate text-[11px]">{holiday.title}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            {selectedHoliday ? (
              <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3">
                <strong className="text-foreground">{selectedHoliday.title}</strong>
                {' - '}
                <span className="text-foreground">
                  {new Date(selectedHoliday.date).toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
                {selectedHoliday.description && (
                  <p className="mt-1.5 text-sm text-[#7f1d1d]">{selectedHoliday.description}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click a highlighted date to see the reason for the holiday.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
