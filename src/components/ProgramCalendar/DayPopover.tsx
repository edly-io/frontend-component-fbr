import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { OverlayTrigger, Popover } from '@openedx/paragon';
import { ProgramDateEvent } from '../../data/sessions/types';
import { useCalendarGrid } from './CalendarGridContext';
import { toDateKey } from './calendarDates';
import DayPopoverSession from './DayPopoverSession';
import GradedDatePopover from './GradedDatePopover';
import { CalendarSession } from './types';

const SCROLL_HINT_MIN_SESSIONS = 3;
const SCROLL_BOTTOM_TOLERANCE_PX = 4;

const plural = (count: number, word: string): string => `${count} ${word}${count !== 1 ? 's' : ''}`;

interface DayPopoverProps {
  date: Date;
  sessions: CalendarSession[];
  gradedDates: ProgramDateEvent[];
  /** The day cell that toggles the popover. */
  children: React.ReactElement;
}

interface DueDatesProps {
  gradedDates: ProgramDateEvent[];
  isDivided: boolean;
}

/** The "Due Dates" group under the day's sessions, each with its own popover. */
const DueDates = ({ gradedDates, isDivided }: DueDatesProps) => {
  const [openGradedId, setOpenGradedId] = useState<string | null>(null);
  return (
    <div className={classNames('calendar-graded__group', { 'calendar-graded__group--divided': isDivided })}>
      <div className="calendar-graded__heading text-uppercase">Due Dates</div>
      {gradedDates.map((event) => (
        <GradedDatePopover
          key={event.id}
          event={event}
          isOpen={openGradedId === event.id}
          onOpenChange={(next) => setOpenGradedId(next ? event.id : null)}
        >
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="calendar-chip calendar-chip--graded-lg text-truncate d-block w-100 mb-1 text-left"
            title={`Due: ${event.title} (${event.courseName})`}
          >
            <div className="calendar-graded__title overflow-hidden">{event.title}</div>
            <div className="calendar-graded__meta overflow-hidden">{event.courseName}</div>
          </button>
        </GradedDatePopover>
      ))}
    </div>
  );
};

/** Month view: every session and due date of one day, anchored to its cell. */
const DayPopover = ({
  date, sessions, gradedDates, children,
}: DayPopoverProps) => {
  const { isDayOpen, setDayOpen } = useCalendarGrid();
  const dateKey = toDateKey(date);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const close = () => setDayOpen(dateKey, false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) { return; }
    setAtBottom(el.scrollHeight - el.scrollTop <= el.clientHeight + SCROLL_BOTTOM_TOLERANCE_PX);
  };

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const showScrollHint = sessions.length >= SCROLL_HINT_MIN_SESSIONS && !atBottom;

  const popover = (
    <Popover id={`day-popover-${dateKey}`} className="calendar-popover calendar-popover--day">
      <Popover.Title as="h5" className="calendar-popover__title calendar-popover__title--day m-0">
        {dateLabel}
        <span className="text-muted ml-1 calendar-popover__title-count">
          ({plural(sessions.length, 'session')}
          {gradedDates.length > 0 && `, ${plural(gradedDates.length, 'due date')}`})
        </span>
      </Popover.Title>
      <Popover.Content className="p-0">
        <div ref={scrollRef} onScroll={handleScroll} className="calendar-popover__scroll overflow-auto p-2">
          {sessions.map((session) => <DayPopoverSession key={session.id} session={session} onClose={close} />)}
          {gradedDates.length > 0 && <DueDates gradedDates={gradedDates} isDivided={sessions.length > 0} />}
        </div>
        {showScrollHint && <div className="calendar-scroll-hint text-center">↓ scroll for more</div>}
      </Popover.Content>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={isDayOpen(dateKey)}
      onToggle={(next: boolean) => setDayOpen(dateKey, next)}
      trigger="click"
      placement="auto"
      rootClose
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};

export default DayPopover;
