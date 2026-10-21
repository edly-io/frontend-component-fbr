// SessionDetailModal — read-only session info. Does NOT show attendance data;
// attendance lives on its own tab. Edit / Cancel / Delete actions live on the
// calendar popover, not here.

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Badge, Button, StandardModal,
} from '@openedx/paragon';
import { Launch } from '@openedx/paragon/icons';

import { ScopeBadge, SessionScope } from '../ScopeBadge';
import { InstructingBadge } from '../InstructingBadge';
import { RequestStatusBadge } from '../RequestStatusBadge';
import { formatDateTime } from '../../utils/dates';
import { getSessionTypeLabel, getStatusVariant } from '../../utils/format';
import {
  SESSION_STATUS, SESSION_STATUS_LABELS, SESSION_PLATFORM_LABELS, USER_ROLE,
} from '../../utils/constants';
import { getSessionStartLink } from '../../data/sessions/api';
import { buildAuditPath, buildRosterPath } from './links';
import { useProgramCalendar } from './ProgramCalendarContext';
import { CalendarSession, SessionDetailModalProps, SessionRecurrence } from './types';
import './SessionDetailModal.scss';

const RECURRENCE_TYPE_LABEL: Record<number, string> = { 1: 'Daily', 2: 'Weekly', 3: 'Monthly' };
const START_LINK_ERROR = 'Could not open the meeting start link. Please try again.';

const formatRecurrence = (recurrence?: SessionRecurrence | null): string => {
  if (!recurrence) { return ''; }
  const base = (recurrence.type && RECURRENCE_TYPE_LABEL[recurrence.type]) || 'Repeats';
  const interval = recurrence.repeat_interval && recurrence.repeat_interval > 1
    ? ` every ${recurrence.repeat_interval}`
    : '';
  if (recurrence.end_times) {
    return `${base}${interval} · ${recurrence.end_times} occurrences`;
  }
  if (recurrence.end_date_time) {
    return `${base}${interval} · ends ${formatDateTime(recurrence.end_date_time)}`;
  }
  return `${base}${interval}`;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="d-flex mb-2 fbr-session-detail__field">
    <div className="text-muted fbr-session-detail__field-label">{label}</div>
    <div className="fbr-session-detail__field-value">{children}</div>
  </div>
);

const openInNewTab = (url?: string | null) => window.open(url ?? undefined, '_blank', 'noopener,noreferrer');

// Fetch a fresh Zoom host start link and open it. Minted on demand (it expires
// ~2h after Zoom generates it), so open a blank tab inside the click gesture to
// dodge popup blockers, then navigate it once the link arrives. Never cached.
const openSessionStartLink = async (sessionId: number) => {
  const win = window.open('about:blank', '_blank');
  if (win) { win.opener = null; }
  try {
    const url = await getSessionStartLink(sessionId);
    if (!url) { throw new Error('No start link returned'); }
    if (win) { win.location.href = url; } else { window.open(url, '_blank', 'noopener,noreferrer'); }
  } catch (err) {
    if (win) { win.close(); }
    // eslint-disable-next-line no-alert
    window.alert(START_LINK_ERROR);
  }
};

const isSessionPast = (session: CalendarSession): boolean => (
  new Date((session.scheduled_end_time || session.scheduled_start_time) as string) <= new Date()
);

const getSessionScope = (session: CalendarSession, hasMeeting: boolean): SessionScope => {
  if (!hasMeeting) { return 'in_person'; }
  return session.create_zoom_meeting ? 'public' : 'gated';
};

const StatusBadges = ({ session, scope }: { session: CalendarSession; scope: SessionScope }) => (
  <div className="d-flex fbr-session-detail__badges">
    <Badge variant={getStatusVariant(session.status ?? '')}>
      {(session.status && SESSION_STATUS_LABELS[session.status]) || session.status}
    </Badge>
    {/* Cancelled session = dead end; suppress scope/instructor/request
        noise. Status badge alone tells the story. */}
    {session.status !== SESSION_STATUS.CANCELLED && (
      <>
        <ScopeBadge scope={scope} />
        {session.user_role === USER_ROLE.INSTRUCTOR && <InstructingBadge />}
        {session.my_request && <RequestStatusBadge request={session.my_request} />}
      </>
    )}
  </div>
);

interface AdminLinksProps {
  session: CalendarSession & { id: number };
  basePath: string;
  onClose: () => void;
}

const AdminLinks = ({ session, basePath, onClose }: AdminLinksProps) => (
  <>
    <Field label="Attendance">
      <Button
        as={Link}
        variant="link"
        size="sm"
        className="p-0"
        to={buildRosterPath(basePath, session.id, session.course_id)}
        state={{
          sessionTitle: session.title,
          sessionTime: session.scheduled_start_time,
          courseName: session.course_name,
        }}
        onClick={onClose}
      >
        View roster →
      </Button>
    </Field>
    <Field label="Audit log">
      <Button
        as={Link}
        variant="link"
        size="sm"
        className="p-0"
        to={buildAuditPath(basePath, session.id)}
        onClick={onClose}
      >
        View history →
      </Button>
    </Field>
  </>
);

const MeetingSection = ({ session, canStartMeeting }: { session: CalendarSession; canStartMeeting: boolean }) => (
  <div className="mt-4 pt-3 fbr-session-detail__section">
    <div className="text-muted mb-2 fbr-session-detail__section-label">Meeting</div>
    <div className="d-flex flex-wrap fbr-session-detail__meeting-actions">
      {canStartMeeting ? (
        <Button
          variant="success"
          size="sm"
          iconAfter={Launch}
          onClick={() => openSessionStartLink(session.id as number)}
        >
          Start as host
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          iconAfter={Launch}
          onClick={() => openInNewTab(session.my_join_url || session.meeting_join_url)}
        >
          Join meeting
        </Button>
      )}
    </div>
    {session.meeting_password && (
      <div className="mt-2 fbr-session-detail__password">
        <span className="text-muted">Password: </span>
        <code>{session.meeting_password}</code>
      </div>
    )}
  </div>
);

const SessionDetailModal = ({
  session = null, isOpen, onClose, canManageSessions = false, sessionTypeLabels = {},
}: SessionDetailModalProps) => {
  const { basePath } = useProgramCalendar();
  if (!session) { return null; }

  const hasMeeting = Boolean(session.meeting_id || session.meeting_join_url);
  const isPast = isSessionPast(session);
  const canStartMeeting = !isPast && Boolean(session.meeting_id)
    && (canManageSessions || session.user_role === USER_ROLE.INSTRUCTOR);
  const canJoinOrStart = canStartMeeting || Boolean(session.my_join_url || session.meeting_join_url);
  const recurrenceSummary = session.is_recurring ? formatRecurrence(session.recurrence) : '';
  const platformLabel = (session.platform && SESSION_PLATFORM_LABELS[session.platform]) || session.platform;
  const instructorList = (session.instructor_names || []).filter(Boolean).join(', ');
  const sessionTypeLabel = getSessionTypeLabel(session, sessionTypeLabels);

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={session.title ?? ''}
      isFullscreenOnMobile
      footerNode={(
        <Button variant="tertiary" onClick={onClose}>Close</Button>
      )}
    >
      {/* First section: structured key/value rows + badges as the final row. */}
      {session.course_name && <Field label="Course">{session.course_name}</Field>}
      {session.location && (
        <Field label="Location">
          <span>{session.location.name}</span>
          {session.location.biometric_machine_serial_number && (
            <span className="text-muted ml-2 fbr-session-detail__biometric">
              (biometric: <code>{session.location.biometric_machine_serial_number}</code>)
            </span>
          )}
        </Field>
      )}
      <Field label="Start">{formatDateTime(session.scheduled_start_time)}</Field>
      <Field label="End">{formatDateTime(session.scheduled_end_time)}</Field>
      {session.duration_minutes != null && (
        <Field label="Duration">{`${session.duration_minutes} min`}</Field>
      )}
      {session.timezone && <Field label="Timezone">{session.timezone}</Field>}
      {platformLabel && <Field label="Platform">{platformLabel}</Field>}
      {sessionTypeLabel && <Field label="Session type">{sessionTypeLabel}</Field>}
      {recurrenceSummary && <Field label="Recurrence">{recurrenceSummary}</Field>}
      {instructorList && <Field label="Instructors">{instructorList}</Field>}
      <Field label="Status">
        <StatusBadges session={session} scope={getSessionScope(session, hasMeeting)} />
      </Field>
      {canManageSessions && session.id && (
        <AdminLinks session={{ ...session, id: session.id }} basePath={basePath} onClose={onClose} />
      )}

      {/* Second section: description (own block, separated). */}
      {session.description && (
        <div className="mt-4 pt-3 fbr-session-detail__section">
          <div className="text-muted mb-1 fbr-session-detail__section-label">Description</div>
          <p className="fbr-session-detail__description">
            {session.description}
          </p>
        </div>
      )}

      {/* Third section: meeting (own block, separated). Hidden once the session
          is past — matches the calendar popover, which already hides both
          Start-as-host and Join once scheduled_end_time passes. */}
      {hasMeeting && !isPast && canJoinOrStart && (
        <MeetingSection session={session} canStartMeeting={canStartMeeting} />
      )}
    </StandardModal>
  );
};

export default SessionDetailModal;
