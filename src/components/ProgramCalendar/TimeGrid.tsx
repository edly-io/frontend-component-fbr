import React from 'react';
import classNames from 'classnames';
import { ProgramDateEvent } from '../../data/sessions/types';
import { useCalendarGrid } from './CalendarGridContext';
import { dayVariant, isWeekendDay, toDateKey } from './calendarDates';
import { formatHour, HOURS } from './timeGridLayout';
import TimeGridColumn from './TimeGridColumn';
import { CalendarHoliday, CalendarSession } from './types';

interface TimeGridProps {
  /** The columns to show: a week (Sun–Sat) or a single day. */
  days: Date[];
  sessionMap: Map<string, CalendarSession[]>;
  holidayMap: Map<string, CalendarHoliday[]>;
  programDatesMap: Map<string, ProgramDateEvent[]>;
}

const DayHeader = ({ day, isToday, isHoliday }: { day: Date; isToday: boolean; isHoliday: boolean }) => {
  const { role, leaveDateMap } = useCalendarGrid();
  return (
    <div
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
  days, sessionMap, holidayMap, programDatesMap,
}: TimeGridProps) => {
  const todayKey = toDateKey(new Date());

  return (
    <div className="calendar-timegrid overflow-hidden">
      <div className="calendar-timegrid__head d-flex">
        {/* Empty corner above the time axis */}
        <div className="calendar-timegrid__time-col flex-shrink-0" />
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
        <div className="calendar-timegrid__canvas fbr-calendar-timegrid__canvas d-flex">
          <div className="calendar-timegrid__time-col flex-shrink-0 position-relative">
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
  );
};

export default TimeGrid;
