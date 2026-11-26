import React from 'react';
import classNames from 'classnames';
import { ProgramDateEvent } from '../../data/sessions/types';
import { gradedPopoverId, useCalendarGrid } from './CalendarGridContext';
import { dayVariant, formatShortTime, toDateKey } from './calendarDates';
import GradedDatePopover from './GradedDatePopover';
import TimeGridEvent from './TimeGridEvent';
import { getTopOffset, HOURS, layoutSessions } from './timeGridLayout';
import { CalendarHoliday, CalendarSession } from './types';

const FULL_WIDTH_LANE = { lane: 0, totalLanes: 1 };

const plural = (count: number, word: string): string => `${count} ${word}${count !== 1 ? 's' : ''}`;

interface TimeGridColumnProps {
  date: Date;
  /** The grid's one tab stop; only its events are in the tab order. */
  isActive: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holidays: CalendarHoliday[];
  sessions: CalendarSession[];
  gradedDates: ProgramDateEvent[];
}

// Holiday name — horizontal on a wide column; below `md` the column is too
// narrow for that, so it runs vertically instead. Both read from the same
// string; CSS picks one.
const HolidayLabels = ({ holidays }: { holidays: CalendarHoliday[] }) => {
  const names = holidays.map((h) => h.name).join(', ');
  return (
    <>
      {['horizontal', 'vertical'].map((orientation) => (
        <div
          key={orientation}
          aria-hidden="true"
          className={`calendar-timegrid__holiday-label calendar-timegrid__holiday-label--${orientation} position-absolute text-truncate user-select-none`}
          title={names}
        >
          {names}
        </div>
      ))}
    </>
  );
};

/** An amber due-date block at its due time. Its top offset comes from the due minutes (custom property). */
const DueBlock = ({ event, tabIndex }: { event: ProgramDateEvent; tabIndex: number }) => {
  const { isPopoverOpen, setPopoverOpen } = useCalendarGrid();
  const dueDate = new Date(event.date);
  const dueTimeLabel = formatShortTime(dueDate);
  const popoverId = gradedPopoverId(event.id);
  return (
    <GradedDatePopover
      event={event}
      isOpen={isPopoverOpen(popoverId)}
      onOpenChange={(next) => setPopoverOpen(popoverId, next)}
    >
      <button
        type="button"
        tabIndex={tabIndex}
        aria-label={`Due ${dueTimeLabel}: ${event.title}, ${event.courseName}`}
        title={`Due: ${event.title} — ${dueTimeLabel}`}
        className="calendar-event calendar-event--graded fbr-calendar-due-block text-truncate position-absolute text-left"
        style={{ '--fbr-event-top': `${getTopOffset(dueDate)}px` } as React.CSSProperties}
      >
        {dueTimeLabel} Due: {event.title}
      </button>
    </GradedDatePopover>
  );
};

/** One day's column in the week/day grid: hour lines, holiday name, due dates and session blocks. */
const TimeGridColumn = ({
  date, isActive, isToday, isWeekend, holidays, sessions, gradedDates,
}: TimeGridColumnProps) => {
  const layout = layoutSessions(sessions);
  const eventTabIndex = isActive ? 0 : -1;
  const label = [
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    isToday && 'today',
    plural(sessions.length, 'session'),
    gradedDates.length > 0 && plural(gradedDates.length, 'due date'),
    holidays.length > 0 && `holiday: ${holidays.map((h) => h.name).join(', ')}`,
  ].filter(Boolean).join(', ');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLElement>('button')?.focus();
    }
  };

  return (
    <div
      role="gridcell"
      tabIndex={isActive ? 0 : -1}
      data-date={toDateKey(date)}
      aria-current={isToday ? 'date' : undefined}
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={classNames(
        'calendar-timegrid__col position-relative',
        `calendar-timegrid__col--${dayVariant(isToday, isWeekend, holidays.length > 0)}`,
      )}
    >
      {holidays.length > 0 && <HolidayLabels holidays={holidays} />}
      {HOURS.map((hour) => (
        <div key={hour} aria-hidden="true" className={`calendar-hour-line fbr-calendar-hour-line--${hour} position-absolute`} />
      ))}
      {gradedDates.map((event) => <DueBlock key={event.id} event={event} tabIndex={eventTabIndex} />)}
      {sessions.map((session) => (
        <TimeGridEvent
          key={session.id}
          session={session}
          lane={layout[String(session.id)] || FULL_WIDTH_LANE}
          tabIndex={eventTabIndex}
        />
      ))}
    </div>
  );
};

export default TimeGridColumn;
