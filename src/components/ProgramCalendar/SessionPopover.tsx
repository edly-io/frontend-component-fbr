import React from 'react';
import { Link } from 'react-router-dom';
import {
  Badge, Button, OverlayTrigger, Popover,
} from '@openedx/paragon';
import { FactCheck, History } from '@openedx/paragon/icons';
import { ScopeBadge } from '../ScopeBadge';
import { InstructingBadge } from '../InstructingBadge';
import { formatInstructorNames, getStatusVariant } from '../../utils/format';
import { REQUEST_STATUS, SESSION_STATUS_LABELS } from '../../utils/constants';
import { buildAuditPath, buildRosterPath } from './links';
import { useProgramCalendar } from './ProgramCalendarContext';
import { useCalendarGrid } from './CalendarGridContext';
import { formatTimeRange } from './calendarDates';
import {
  getDisplayStatus, getSessionScope, isCancelled, isSessionInstructor,
} from './sessionDisplay';
import SessionActions from './SessionActions';
import SessionTypeBadge from './SessionTypeBadge';
import TitleLink from './TitleLink';
import { CalendarSession } from './types';

interface SessionPopoverProps {
  session: CalendarSession;
  /** The chip or block that toggles the popover. */
  children: React.ReactElement;
}

interface AdminLinksProps {
  session: CalendarSession;
  onClose: () => void;
}

/** Admin-only quick links to the attendance roster and the audit history. */
const AdminLinks = ({ session, onClose }: AdminLinksProps) => {
  const { basePath } = useProgramCalendar();
  return (
    <div className="d-flex align-items-center calendar-popover__actions flex-wrap mt-2">
      <Button
        as={Link}
        variant="tertiary"
        size="sm"
        iconBefore={FactCheck}
        to={buildRosterPath(basePath, session.id as number, session.course_id)}
        state={{
          sessionTitle: session.title,
          sessionTime: session.scheduled_start_time,
          courseName: session.course_name,
        }}
        onClick={onClose}
      >
        Attendance
      </Button>
      <Button
        as={Link}
        variant="tertiary"
        size="sm"
        iconBefore={History}
        to={buildAuditPath(basePath, session.id as number)}
        onClick={onClose}
      >
        History
      </Button>
    </div>
  );
};

/**
 * Anchored to a chip or block: session details and per-session actions.
 * Controlled — only one popover is open across the whole calendar, and it
 * closes cleanly when Edit/Delete opens a modal.
 */
const SessionPopover = ({ session, children }: SessionPopoverProps) => {
  const {
    role, handlers, sessionTypeLabels, isPopoverOpen, setPopoverOpen,
  } = useCalendarGrid();
  const popoverId = session.id as number;
  const close = () => setPopoverOpen(popoverId, false);
  const displayStatus = getDisplayStatus(session);
  const instructorDisplay = formatInstructorNames(session);
  const myRequest = session.my_request;

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
    handlers.onSessionDetail(session);
  };

  const popover = (
    <Popover id={`session-popover-${session.id}`} className="calendar-popover calendar-popover--session">
      <Popover.Title as="h5" className="calendar-popover__title calendar-popover__title--session m-0">
        <TitleLink
          title={session.title as string}
          onClick={handleViewDetail}
          isCancelled={isCancelled(displayStatus)}
        />
      </Popover.Title>
      <Popover.Content className="calendar-popover__content">
        {session.course_name && <div className="text-muted mb-1">Course: {session.course_name}</div>}
        {instructorDisplay && <div className="text-muted mb-1">Instructor: {instructorDisplay}</div>}
        <div className="d-flex align-items-center mb-2 calendar-popover__badges flex-wrap">
          <span>{formatTimeRange(session)}</span>
        </div>
        <div className="mb-2 d-flex calendar-popover__meta flex-wrap">
          <Badge variant={getStatusVariant(displayStatus as string)}>
            {SESSION_STATUS_LABELS[displayStatus as string] || displayStatus}
          </Badge>
          {/* Cancelled session = dead end; suppress scope/instructor noise. */}
          {!isCancelled(displayStatus) && (
            <>
              {role.canManageSessions && <ScopeBadge scope={getSessionScope(session)} />}
              <SessionTypeBadge session={session} sessionTypeLabels={sessionTypeLabels} />
              {isSessionInstructor(session) && <InstructingBadge />}
            </>
          )}
        </div>
        <SessionActions
          session={session}
          request={myRequest}
          badgeRequest={myRequest?.state === REQUEST_STATUS.APPROVED ? myRequest : null}
          className="d-flex align-items-center calendar-popover__actions flex-wrap"
          onClose={close}
        />
        {role.canManageSessions && session.id && <AdminLinks session={session} onClose={close} />}
      </Popover.Content>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={isPopoverOpen(popoverId)}
      onToggle={(next: boolean) => setPopoverOpen(popoverId, next)}
      trigger="click"
      placement="auto"
      rootClose
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};

export default SessionPopover;
