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
  /** The grid's one tab stop. */
  isActive: boolean;
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
            tabIndex={-1}
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
        tabIndex={-1}
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

const plural = (count: number, word: string): string => `${count} ${word}${count !== 1 ? 's' : ''}`;

interface CellLabelParts {
  date: Date;
  isToday: boolean;
  sessionCount: number;
  dueCount: number;
  holidays: CalendarHoliday[];
  isOnLeave: boolean;
}

/** Everything the cell shows, in one name: "Tuesday, November 12, today, 2 sessions, 1 due date, …". */
const cellAriaLabel = ({
  date, isToday, sessionCount, dueCount, holidays, isOnLeave,
}: CellLabelParts): string => [
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  isToday && 'today',
  plural(sessionCount, 'session'),
  dueCount > 0 && plural(dueCount, 'due date'),
  holidays.length > 0 && `holiday: ${holidays.map((h) => h.name).join(', ')}`,
  isOnLeave && 'on leave',
].filter(Boolean).join(', ');

/** One day of the month grid: holidays, leave banner, due dates and up to two session chips. */
const DayCell = ({
  date, sessions, holidays, gradedDates, isOutsideMonth, isActive,
}: DayCellProps) => {
  const {
    role, leaveDateMap, isDayOpen, setDayOpen,
  } = useCalendarGrid();
  const dateKey = toDateKey(date);
  const isToday = dateKey === toDateKey(new Date());
  const overflow = sessions.length - MAX_CHIPS;
  const hasSessions = sessions.length > 0 || gradedDates.length > 0;
  const isOnLeave = Boolean((role.isLearner || role.isInstructor) && leaveDateMap?.get(dateKey));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) { return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setDayOpen(dateKey, !isDayOpen(dateKey));
    }
  };

  // A grid cell: one roving tab stop for the whole grid. Enter/Space opens the
  // day popover, which lists every session and due date as a button, so the
  // chips inside stay out of the tab order.
  const cellContent = (
    <div
      role="gridcell"
      tabIndex={isActive ? 0 : -1}
      data-date={dateKey}
      aria-current={isToday ? 'date' : undefined}
      aria-expanded={hasSessions ? isDayOpen(dateKey) : undefined}
      onKeyDown={hasSessions ? handleKeyDown : undefined}
      className={classNames(
        'calendar-day-cell fbr-calendar-day-cell d-flex flex-column align-items-stretch text-left w-100',
        `calendar-day-cell--${dayVariant(isToday, isWeekendDay(date))}`,
        { 'calendar-day-cell--clickable': hasSessions, 'calendar-day-cell--outside': isOutsideMonth },
      )}
      aria-label={cellAriaLabel({
        date,
        isToday,
        sessionCount: sessions.length,
        dueCount: gradedDates.length,
        holidays,
        isOnLeave,
      })}
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
      {isOnLeave && (
        <div className="calendar-chip calendar-chip--leave text-truncate">On Leave</div>
      )}
      <GradedChips gradedDates={gradedDates} />
      {sessions.slice(0, MAX_CHIPS).map((session) => <SessionChip key={session.id} session={session} />)}
      {overflow > 0 && (
        <Button
          variant="link"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDayOpen(dateKey, true); }}
          tabIndex={-1}
          className="calendar-link-button calendar-link-button--chip border-0 p-0 text-left"
        >
          +{overflow} more
        </Button>
      )}
    </div>
  );

  if (!hasSessions) { return cellContent; }

  return (
    <DayPopover date={date} sessions={sessions} gradedDates={gradedDates}>
      {cellContent}
    </DayPopover>
  );
};

export default DayCell;
