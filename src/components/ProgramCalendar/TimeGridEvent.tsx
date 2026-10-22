import React from 'react';
import classNames from 'classnames';
import { useCalendarGrid } from './CalendarGridContext';
import { formatShortTime } from './calendarDates';
import { chipBgClass, isCancelled, statusDotClass } from './sessionDisplay';
import { getSessionPosition, getTitleLineCount, SessionLane } from './timeGridLayout';
import SessionPopover from './SessionPopover';
import { CalendarSession } from './types';

// Labels that only fit in roomier blocks.
const MIN_HEIGHT_FOR_TIME = 30;
const MIN_HEIGHT_FOR_LEAVE_LABEL = 28;
const MIN_HEIGHT_FOR_COURSE = 45;
const MAX_LANES_FOR_TIME = 3;
const MAX_LANES_FOR_COURSE = 2;
const NARROW_FROM_LANES = 2;

interface TimeGridEventProps {
  session: CalendarSession;
  lane: SessionLane;
}

/**
 * The block's position comes from the session's own minutes and overlap lane,
 * which no fixed class can carry, so calendar.scss reads them from custom
 * properties (`.fbr-calendar-event-block`).
 */
const blockPosition = (top: number, height: number, { lane, totalLanes }: SessionLane) => ({
  '--fbr-event-top': `${top}px`,
  '--fbr-event-height': `${height}px`,
  '--fbr-event-lane': lane,
  '--fbr-event-lanes': totalLanes,
}) as React.CSSProperties;

const blockClass = (lane: SessionLane, ...extra: string[]) => classNames(
  'calendar-event fbr-calendar-event-block position-absolute text-left overflow-hidden',
  { 'fbr-calendar-event-block--narrow': lane.totalLanes >= NARROW_FROM_LANES },
  ...extra,
);

const titleClass = (height: number, ...extra: Array<string | false>) => classNames(
  'calendar-event__title overflow-hidden',
  `fbr-calendar-event-block__title--lines-${getTitleLineCount(height)}`,
  ...extra,
);

/** A session block in the week/day grid; a session on approved leave is a non-interactive grey block. */
const TimeGridEvent = ({ session, lane }: TimeGridEventProps) => {
  const { studentRequestMap, sessionTypeColors } = useCalendarGrid();
  const { top, height } = getSessionPosition(session);
  const startTime = formatShortTime(new Date(session.scheduled_start_time as string));

  if (studentRequestMap?.get(session.id as number)) {
    return (
      <div
        title={`${session.title} — On Leave`}
        className={blockClass(lane, 'calendar-event--onleave user-select-none')}
        style={blockPosition(top, height, lane)}
      >
        <div className="calendar-event__row d-flex align-items-start">
          <span className="calendar-dot calendar-dot--md calendar-dot--onleave rounded-circle flex-shrink-0" />
          <strong className={titleClass(height, 'calendar-strikethrough')}>{session.title}</strong>
        </div>
        {height >= MIN_HEIGHT_FOR_LEAVE_LABEL && lane.totalLanes < MAX_LANES_FOR_TIME && (
          <span className="calendar-event__time calendar-event__time--xs">On Leave</span>
        )}
      </div>
    );
  }

  return (
    <SessionPopover session={session}>
      <button
        type="button"
        title={`${session.title} — ${startTime}`}
        className={blockClass(lane, 'calendar-event--session border-0', chipBgClass(session, sessionTypeColors))}
        style={blockPosition(top, height, lane)}
      >
        <div className="calendar-event__row d-flex align-items-start">
          <span
            className={classNames('calendar-dot calendar-dot--md rounded-circle flex-shrink-0', statusDotClass(session.status))}
          />
          <strong className={titleClass(height, isCancelled(session.status) && 'calendar-strikethrough')}>
            {session.title}
          </strong>
        </div>
        {/* Time label — hidden in narrow (3+ lane) columns; the popover has it. */}
        {height >= MIN_HEIGHT_FOR_TIME && lane.totalLanes < MAX_LANES_FOR_TIME && (
          <span className="calendar-event__time">{startTime}</span>
        )}
        {/* Course name — only in full-width columns with enough height. */}
        {height >= MIN_HEIGHT_FOR_COURSE && lane.totalLanes < MAX_LANES_FOR_COURSE && session.course_name && (
          <span className="calendar-event__time text-truncate d-block">{session.course_name}</span>
        )}
      </button>
    </SessionPopover>
  );
};

export default TimeGridEvent;
