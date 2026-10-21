import React from 'react';
import {
  Badge, Button, Icon, OverlayTrigger, Tooltip,
} from '@openedx/paragon';
import { InfoOutline } from '@openedx/paragon/icons';
import { getSessionTypeLabel } from '../../utils/format';
import { CalendarSession } from './types';

const TOOLTIP = 'Session type.';

interface SessionTypeBadgeProps {
  session: CalendarSession;
  sessionTypeLabels: Record<string, string>;
}

const SessionTypeBadge = ({ session, sessionTypeLabels }: SessionTypeBadgeProps) => {
  const label = getSessionTypeLabel(session, sessionTypeLabels);
  if (!label) { return null; }
  return (
    <span className="d-inline-flex align-items-center calendar-type-badge">
      <Badge variant="secondary">{label}</Badge>
      <OverlayTrigger
        trigger={['hover', 'focus']}
        placement="top"
        overlay={<Tooltip id={`session-type-tip-${session.session_type || 'unknown'}`}>{TOOLTIP}</Tooltip>}
      >
        <Button
          variant="link"
          aria-label={TOOLTIP}
          className="d-inline-flex align-items-center p-0 border-0 text-muted"
        >
          <Icon src={InfoOutline} className="text-muted" />
        </Button>
      </OverlayTrigger>
    </span>
  );
};

export default SessionTypeBadge;
