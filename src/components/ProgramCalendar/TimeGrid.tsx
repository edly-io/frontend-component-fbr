import React from 'react';
import classNames from 'classnames';
import { ProgramDateEvent } from '../../data/sessions/types';
import { useCalendarGrid } from './CalendarGridContext';
import {
  dayVariant, getToday, isWeekendDay, toDateKey,
} from './calendarDates';
import { formatHour, HOURS } from './timeGridLayout';
import TimeGridColumn from './TimeGridColumn';
import { CalendarHoliday, CalendarSession } from './types';
import useRovingDate from './useRovingDate';

const GRID_HINT_ID = 'calendar-timegrid-hint';

interface TimeGridProps {
  /** The columns to show: a week (Sun–Sat) or a single day. */
  days: Date[];
  /** Visible range, e.g. "Nov 8 – Nov 14, 2026"; names the grid. */
  label: string;
  sessionMap: Map<string, CalendarSession[]>;
  holidayMap: Map<string, CalendarHoliday[]>;
  programDatesMap: Map<string, ProgramDateEvent[]>;
  onNavigate: (direction: number) => void;
}

const DayHeader = ({ day, isToday, isHoliday }: { day: Date; isToday: boolean; isHoliday: boolean }) => {
  const { role, leaveDateMap } = useCalendarGrid();
  return (
    <div
      role="columnheader"
      className={classNames(
        'calendar-timegrid__day text-center',
        `calendar-timegrid__day--${dayVariant(isToday, isWeekendDay(day), isHoliday)}`,
      )}
    >
      {day.toLocaleDateString('en-US', { weekday: 'short' })} {day.getDate()}
      {role.isLearner && leaveDateMap?.get(toDateKey(day)) && (
        <div className="calendar-tag calendar-tag--leave text-truncate">On Leave</div>
      )}
    </div>
  );
};

/** The week and day views: a 24-hour grid with one column per day. */
const TimeGrid = ({
  days, label, sessionMap, holidayMap, programDatesMap, onNavigate,
}: TimeGridProps) => {
  const todayKey = toDateKey(new Date());
  const { gridRef, activeKey, handleKeyDown } = useRovingDate({
    days, defaultDate: getToday(), onNavigate, isMonth: false,
  });

  return (
    <>
      <p id={GRID_HINT_ID} className="sr-only">
        Use the left and right arrow keys to move between days, and Enter or Tab to reach a day&apos;s sessions.
      </p>
      {/* Focus roves between the day cells, so the grid itself takes none. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={gridRef}
        className="calendar-timegrid overflow-hidden"
        role="grid"
        aria-label={label}
        aria-describedby={GRID_HINT_ID}
        onKeyDown={handleKeyDown}
      >
        <div className="calendar-timegrid__head d-flex" role="row">
          {/* Empty corner above the time axis */}
          <div className="calendar-timegrid__time-col flex-shrink-0" aria-hidden="true" />
          {days.map((day) => {
            const key = toDateKey(day);
            return (
              <DayHeader
                key={key}
                day={day}
                isToday={key === todayKey}
                isHoliday={(holidayMap.get(key) || []).length > 0}
              />
            );
          })}
        </div>

        <div className="calendar-timegrid__body overflow-auto">
          <div className="calendar-timegrid__canvas fbr-calendar-timegrid__canvas d-flex" role="row">
            <div className="calendar-timegrid__time-col flex-shrink-0 position-relative" aria-hidden="true">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={`calendar-hour-label fbr-calendar-hour-label--${hour} position-absolute user-select-none`}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>
            {days.map((day) => {
              const key = toDateKey(day);
              return (
                <TimeGridColumn
                  key={key}
                  date={day}
                  isActive={key === activeKey}
                  isToday={key === todayKey}
                  isWeekend={isWeekendDay(day)}
                  holidays={holidayMap.get(key) || []}
                  sessions={sessionMap.get(key) || []}
                  gradedDates={programDatesMap.get(key) || []}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeGrid;
