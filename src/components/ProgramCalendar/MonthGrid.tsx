import React from 'react';
import { ProgramDateEvent } from '../../data/sessions/types';
import { getMonthGridDays, toDateKey, WEEK_DAY_NAMES } from './calendarDates';
import DayCell from './DayCell';
import { CalendarHoliday, CalendarSession } from './types';

// Columns run Sun (0) … Sat (6).
const isWeekendColumn = (idx: number): boolean => idx === 0 || idx === WEEK_DAY_NAMES.length - 1;

interface MonthGridProps {
  currentDate: Date;
  sessionMap: Map<string, CalendarSession[]>;
  holidayMap: Map<string, CalendarHoliday[]>;
  gradedDatesMap: Map<string, ProgramDateEvent[]>;
}

const MonthGrid = ({
  currentDate, sessionMap, holidayMap, gradedDatesMap,
}: MonthGridProps) => {
  const days = getMonthGridDays(currentDate);
  const currentMonth = currentDate.getMonth();

  return (
    <div className="calendar-month">
      <div className="calendar-month__inner">
        {/* Day-name header row. It shares `calendar-month__col` with the grid
            below so the two stay in the same columns. */}
        <div className="calendar-month__head">
          {WEEK_DAY_NAMES.map((name, idx) => (
            <div
              key={name}
              className={`calendar-month__col calendar-month__day-name calendar-month__day-name--${
                isWeekendColumn(idx) ? 'weekend' : 'weekday'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        <div className="calendar-month__grid">
          {days.map((day) => {
            const key = toDateKey(day);
            return (
              <div className="calendar-month__col" key={key}>
                <DayCell
                  date={day}
                  sessions={sessionMap.get(key) || []}
                  holidays={holidayMap.get(key) || []}
                  gradedDates={gradedDatesMap.get(key) || []}
                  isOutsideMonth={day.getMonth() !== currentMonth}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthGrid;
