import React from 'react';
import classNames from 'classnames';
import { ProgramDateEvent } from '../../data/sessions/types';
import { gradedPopoverId, useCalendarGrid } from './CalendarGridContext';
import { dayVariant, formatShortTime } from './calendarDates';
import GradedDatePopover from './GradedDatePopover';
import TimeGridEvent from './TimeGridEvent';
import { getTopOffset, HOURS, layoutSessions } from './timeGridLayout';
import { CalendarHoliday, CalendarSession } from './types';

const FULL_WIDTH_LANE = { lane: 0, totalLanes: 1 };

interface TimeGridColumnProps {
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
const DueBlock = ({ event }: { event: ProgramDateEvent }) => {
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
  isToday, isWeekend, holidays, sessions, gradedDates,
}: TimeGridColumnProps) => {
  const layout = layoutSessions(sessions);
  return (
    <div
      className={classNames(
        'calendar-timegrid__col position-relative',
        `calendar-timegrid__col--${dayVariant(isToday, isWeekend, holidays.length > 0)}`,
      )}
    >
      {holidays.length > 0 && <HolidayLabels holidays={holidays} />}
      {HOURS.map((hour) => (
        <div key={hour} className={`calendar-hour-line fbr-calendar-hour-line--${hour} position-absolute`} />
      ))}
      {gradedDates.map((event) => <DueBlock key={event.id} event={event} />)}
      {sessions.map((session) => (
        <TimeGridEvent key={session.id} session={session} lane={layout[String(session.id)] || FULL_WIDTH_LANE} />
      ))}
    </div>
  );
};

export default TimeGridColumn;
