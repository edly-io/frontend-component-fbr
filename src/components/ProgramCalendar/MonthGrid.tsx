import React from 'react';
import { ProgramDateEvent } from '../../data/sessions/types';
import {
  getMonthGridDays, getToday, toDateKey, WEEK_DAY_NAMES,
} from './calendarDates';
import DayCell from './DayCell';
import { CalendarHoliday, CalendarSession } from './types';
import useRovingDate from './useRovingDate';

const DAYS_IN_WEEK = 7;
const WEEK_DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const GRID_HINT_ID = 'calendar-month-grid-hint';

// Columns run Sun (0) … Sat (6).
const isWeekendColumn = (idx: number): boolean => idx === 0 || idx === WEEK_DAY_NAMES.length - 1;

const toWeeks = (days: Date[]): Date[][] => Array.from(
  { length: Math.ceil(days.length / DAYS_IN_WEEK) },
  (_, week) => days.slice(week * DAYS_IN_WEEK, (week + 1) * DAYS_IN_WEEK),
);

interface MonthGridProps {
  currentDate: Date;
  /** Visible range, e.g. "November 2026"; names the grid. */
  label: string;
  sessionMap: Map<string, CalendarSession[]>;
  holidayMap: Map<string, CalendarHoliday[]>;
  gradedDatesMap: Map<string, ProgramDateEvent[]>;
  onNavigate: (direction: number) => void;
}

const MonthGrid = ({
  currentDate, label, sessionMap, holidayMap, gradedDatesMap, onNavigate,
}: MonthGridProps) => {
  const days = getMonthGridDays(currentDate);
  const currentMonth = currentDate.getMonth();
  const today = getToday();
  const isTodayInMonth = today.getMonth() === currentMonth && today.getFullYear() === currentDate.getFullYear();
  const { gridRef, activeKey, handleKeyDown } = useRovingDate({
    days,
    defaultDate: isTodayInMonth ? today : new Date(currentDate.getFullYear(), currentMonth, 1),
    onNavigate,
    isMonth: true,
  });

  return (
    <div className="calendar-month">
      <p id={GRID_HINT_ID} className="sr-only">
        Use the arrow keys to move between days, Page Up and Page Down to change month,
        and Enter to see a day&apos;s sessions.
      </p>
      {/* Focus roves between the day cells, so the grid itself takes none. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={gridRef}
        className="calendar-month__inner"
        role="grid"
        aria-label={label}
        aria-describedby={GRID_HINT_ID}
        onKeyDown={handleKeyDown}
      >
        {/* Day-name header row. It shares `calendar-month__col` with the weeks
            below so the two stay in the same columns. */}
        <div className="calendar-month__head" role="row">
          {WEEK_DAY_NAMES.map((name, idx) => (
            <div
              key={name}
              role="columnheader"
              aria-label={WEEK_DAY_FULL_NAMES[idx]}
              className={`calendar-month__col calendar-month__day-name calendar-month__day-name--${
                isWeekendColumn(idx) ? 'weekend' : 'weekday'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        <div className="calendar-month__grid" role="rowgroup">
          {toWeeks(days).map((week) => (
            <div className="calendar-month__week" role="row" key={toDateKey(week[0])}>
              {week.map((day) => {
                const key = toDateKey(day);
                return (
                  <DayCell
                    key={key}
                    date={day}
                    sessions={sessionMap.get(key) || []}
                    holidays={holidayMap.get(key) || []}
                    gradedDates={gradedDatesMap.get(key) || []}
                    isOutsideMonth={day.getMonth() !== currentMonth}
                    isActive={key === activeKey}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthGrid;
