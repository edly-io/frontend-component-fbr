import React from 'react';
import classNames from 'classnames';
import { Button } from '@openedx/paragon';
import { ProgramDateEvent } from '../../data/sessions/types';
import { gradedPopoverId, useCalendarGrid } from './CalendarGridContext';
import { dayVariant, isWeekendDay, toDateKey } from './calendarDates';
import { chipBgClass, isCancelled, statusDotClass } from './sessionDisplay';
import DayPopover from './DayPopover';
import GradedDatePopover from './GradedDatePopover';
import SessionPopover from './SessionPopover';
import { CalendarHoliday, CalendarSession } from './types';

const MAX_CHIPS = 2;

interface DayCellProps {
  date: Date;
  sessions: CalendarSession[];
  holidays: CalendarHoliday[];
  gradedDates: ProgramDateEvent[];
  isOutsideMonth: boolean;
}

const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation();

const GradedChips = ({ gradedDates }: { gradedDates: ProgramDateEvent[] }) => {
  const { isPopoverOpen, setPopoverOpen, closeDayPopover } = useCalendarGrid();
  const hidden = gradedDates.length - MAX_CHIPS;
  return (
    <>
      {gradedDates.slice(0, MAX_CHIPS).map((event) => (
        <GradedDatePopover
          key={event.id}
          event={event}
          isOpen={isPopoverOpen(gradedPopoverId(event.id))}
          onOpenChange={(next) => setPopoverOpen(gradedPopoverId(event.id), next)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeDayPopover(); }}
            onKeyDown={stopKeys}
            title={`Due: ${event.title} (${event.courseName})`}
            className="calendar-chip calendar-chip--graded text-truncate d-block text-left w-100"
          >
            {event.title}
          </button>
        </GradedDatePopover>
      ))}
      {hidden > 0 && (
        <div className="calendar-graded__more">+{hidden} due date{hidden > 1 ? 's' : ''}</div>
      )}
    </>
  );
};

/** A session chip; sessions covered by an approved leave render as non-interactive grey chips. */
const SessionChip = ({ session }: { session: CalendarSession }) => {
  const { studentRequestMap, sessionTypeColors, closeDayPopover } = useCalendarGrid();
  if (studentRequestMap?.get(session.id as number)) {
    return (
      <div
        title={`${session.title} — On Leave`}
        className="calendar-chip calendar-chip--onleave text-truncate d-block w-100 user-select-none"
      >
        {session.title}
      </div>
    );
  }
  return (
    <SessionPopover session={session}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); closeDayPopover(); }}
        onKeyDown={stopKeys}
        title={session.title}
        className={classNames(
          'calendar-chip calendar-chip--session text-truncate d-block border-0 w-100',
          chipBgClass(session, sessionTypeColors),
        )}
      >
        <span className="calendar-chip__inner d-flex align-items-center overflow-hidden">
          <span
            className={classNames('calendar-dot calendar-dot--sm rounded-circle flex-shrink-0', statusDotClass(session.status))}
          />
          <span className={classNames('text-truncate', { 'calendar-strikethrough': isCancelled(session.status) })}>
            {session.title}
          </span>
        </span>
      </button>
    </SessionPopover>
  );
};

const cellAriaLabel = (date: Date, sessionCount: number): string => (
  `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, `
  + `${sessionCount} session${sessionCount !== 1 ? 's' : ''}`
);

/** One day of the month grid: holidays, leave banner, due dates and up to two session chips. */
const DayCell = ({
  date, sessions, holidays, gradedDates, isOutsideMonth,
}: DayCellProps) => {
  const {
    role, leaveDateMap, isDayOpen, setDayOpen,
  } = useCalendarGrid();
  const dateKey = toDateKey(date);
  const isToday = dateKey === toDateKey(new Date());
  const overflow = sessions.length - MAX_CHIPS;
  const hasSessions = sessions.length > 0 || gradedDates.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setDayOpen(dateKey, !isDayOpen(dateKey));
    }
  };

  // The cell is interactive (Enter/Space toggles the day popover) but contains
  // its own button children (session chips, "+N more"), so it can't be a real
  // <button> — nested buttons are invalid HTML. role + tabIndex + onKeyDown
  // give the same affordances on a div.
  /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex */
  const cellContent = (
    <div
      role={hasSessions ? 'button' : undefined}
      tabIndex={hasSessions ? 0 : undefined}
      onKeyDown={hasSessions ? handleKeyDown : undefined}
      className={classNames(
        'calendar-day-cell fbr-calendar-day-cell d-flex flex-column align-items-stretch text-left w-100',
        `calendar-day-cell--${dayVariant(isToday, isWeekendDay(date))}`,
        { 'calendar-day-cell--clickable': hasSessions, 'calendar-day-cell--outside': isOutsideMonth },
      )}
      aria-label={cellAriaLabel(date, sessions.length)}
    >
      <span
        className={classNames(
          'calendar-day-number d-inline-flex align-items-center justify-content-center rounded-circle mb-1 flex-shrink-0',
          { 'calendar-day-number--today': isToday },
        )}
      >
        {date.getDate()}
      </span>
      {holidays.map((h) => (
        <div key={h.id} className="calendar-chip calendar-chip--holiday text-truncate">{h.name}</div>
      ))}
      {(role.isLearner || role.isInstructor) && leaveDateMap?.get(dateKey) && (
        <div className="calendar-chip calendar-chip--leave text-truncate">On Leave</div>
      )}
      <GradedChips gradedDates={gradedDates} />
      {sessions.slice(0, MAX_CHIPS).map((session) => <SessionChip key={session.id} session={session} />)}
      {overflow > 0 && (
        <Button
          variant="link"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDayOpen(dateKey, true); }}
          className="calendar-link-button calendar-link-button--chip border-0 p-0 text-left"
        >
          +{overflow} more
        </Button>
      )}
    </div>
  );
  /* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex */

  if (!hasSessions) { return cellContent; }

  return (
    <DayPopover date={date} sessions={sessions} gradedDates={gradedDates}>
      {cellContent}
    </DayPopover>
  );
};

export default DayCell;
