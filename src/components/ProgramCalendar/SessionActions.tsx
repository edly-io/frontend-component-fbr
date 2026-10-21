import React from 'react';
import { Button } from '@openedx/paragon';
import {
  DeleteOutline, EditOutline, EventBusy, Launch,
} from '@openedx/paragon/icons';
import { RequestStatusBadge } from '../RequestStatusBadge';
import { useCalendarGrid } from './CalendarGridContext';
import openSessionStartLink from './openSessionStartLink';
import {
  canEditSession, canRemoveSession, canStartMeeting, getJoinUrl, isSessionPast, openJoinUrl,
  showsSessionActions,
} from './sessionDisplay';
import { CalendarRequest, CalendarSession } from './types';

interface SessionActionsProps {
  session: CalendarSession;
  /** The viewer's request on this session; decides whether a learner may join. */
  request?: CalendarRequest | null;
  /** The request to show as a status badge to learners, if any. */
  badgeRequest?: CalendarRequest | null;
  className: string;
  /** Closes the popover the actions sit in. */
  onClose: () => void;
}

/** Edit / Cancel / Delete / Start as host / Join, as the viewer's role allows. */
const SessionActions = ({
  session, request = null, badgeRequest = null, className, onClose,
}: SessionActionsProps) => {
  const { role, handlers } = useCalendarGrid();
  if (!showsSessionActions(session)) { return null; }

  const run = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    action();
  };
  const joinUrl = getJoinUrl(session, role, request);
  const showBadge = Boolean(badgeRequest) && role.isLearner && !isSessionPast(session);

  return (
    <div className={className}>
      {canEditSession(session, role) && (
        <Button variant="tertiary" size="sm" iconBefore={EditOutline} onClick={run(() => handlers.onEdit(session))}>
          Edit
        </Button>
      )}
      {canRemoveSession(session, role) && (
        <>
          <Button
            variant="tertiary"
            size="sm"
            iconBefore={EventBusy}
            onClick={run(() => handlers.onCancel(session))}
            className="calendar-action--cancel"
          >
            Cancel
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            iconBefore={DeleteOutline}
            onClick={run(() => handlers.onDelete(session))}
            className="calendar-action--delete"
          >
            Delete
          </Button>
        </>
      )}
      {canStartMeeting(session, role) && (
        <Button
          variant="success"
          size="sm"
          iconAfter={Launch}
          onClick={run(() => openSessionStartLink(session.id as number))}
        >
          Start as host
        </Button>
      )}
      {joinUrl && (
        <Button variant="primary" size="sm" iconAfter={Launch} onClick={run(() => openJoinUrl(joinUrl))}>
          Join
        </Button>
      )}
      {showBadge && <RequestStatusBadge request={badgeRequest} />}
    </div>
  );
};

export default SessionActions;
