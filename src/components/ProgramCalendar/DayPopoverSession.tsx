import React from 'react';
import classNames from 'classnames';
import { Badge } from '@openedx/paragon';
import { ScopeBadge } from '../ScopeBadge';
import { InstructingBadge } from '../InstructingBadge';
import { formatInstructorNames, getStatusVariant } from '../../utils/format';
import { SESSION_STATUS_LABELS } from '../../utils/constants';
import { useCalendarGrid } from './CalendarGridContext';
import { formatTimeRange } from './calendarDates';
import {
  getDisplayStatus, getSessionScope, isCancelled, isSessionInstructor, statusBgClass,
} from './sessionDisplay';
import SessionActions from './SessionActions';
import SessionTypeBadge from './SessionTypeBadge';
import TitleLink from './TitleLink';
import { CalendarSession } from './types';

interface DayPopoverSessionProps {
  session: CalendarSession;
  /** Closes the day popover. */
  onClose: () => void;
}

/** One session row inside the month view's day popover, with inline actions. */
const DayPopoverSession = ({ session, onClose }: DayPopoverSessionProps) => {
  const {
    role, handlers, studentRequestMap, sessionTypeLabels,
  } = useCalendarGrid();
  const instructorDisplay = formatInstructorNames(session);
  const leaveRequest = studentRequestMap?.get(session.id as number);
  const myRequest = leaveRequest || session.my_request;
  const displayStatus = getDisplayStatus(session);
  const showsDetails = !isCancelled(session.status);

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    handlers.onSessionDetail(session);
  };

  return (
    <div className="d-flex align-items-start calendar-day-session">
      <span
        className={classNames(
          'calendar-dot calendar-dot--lg rounded-circle flex-shrink-0',
          statusBgClass(displayStatus),
        )}
      />
      <div className="calendar-day-session__body">
        <div className="calendar-day-session__title">
          <TitleLink
            title={session.title as string}
            onClick={handleViewDetail}
            isCancelled={isCancelled(displayStatus)}
          />
        </div>
        {session.course_name && <div className="text-muted calendar-day-session__meta">{session.course_name}</div>}
        {instructorDisplay && (
          <div className="text-muted calendar-day-session__meta">Instructor: {instructorDisplay}</div>
        )}
        <div className="calendar-day-session__note">{formatTimeRange(session)}</div>
        {/* On Leave indicator for learner-approved leaves */}
        {leaveRequest && <div className="calendar-leave-tag d-inline-block">On Leave</div>}
        <div className="mt-1 d-flex calendar-day-session__badges flex-wrap">
          <Badge variant={getStatusVariant(displayStatus as string)}>
            {SESSION_STATUS_LABELS[displayStatus as string] || displayStatus}
          </Badge>
          {/* Cancelled session = dead end; suppress scope/instructor noise. */}
          {showsDetails && (
            <>
              {role.canManageSessions && <ScopeBadge scope={getSessionScope(session)} />}
              <SessionTypeBadge session={session} sessionTypeLabels={sessionTypeLabels} />
            </>
          )}
        </div>
        {showsDetails && isSessionInstructor(session) && <div className="mt-1"><InstructingBadge /></div>}
        <SessionActions
          session={session}
          request={myRequest}
          badgeRequest={myRequest}
          className="mt-1 d-flex align-items-center calendar-day-session__actions flex-wrap"
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default DayPopoverSession;
