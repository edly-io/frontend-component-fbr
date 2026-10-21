// Per-session display rules shared by the popovers, chips and time-grid blocks.

import { SessionScope } from '../ScopeBadge';
import {
  REQUEST_STATUS, REQUEST_TYPE, SESSION_STATUS, SESSION_STATUS_LABELS, USER_ROLE,
} from '../../utils/constants';
import { CalendarRequest, CalendarSession, CalendarViewerRole } from './types';

// Statuses with their own chip, dot and block colours (calendar.scss
// `fbr-calendar-status-*`). Anything else falls back to `--default`.
const COLOURED_STATUSES = new Set<string>(Object.keys(SESSION_STATUS_LABELS));
const DEFAULT_COLOUR = 'default';

// Session-type chip colours: `fbr-calendar-type-bg--0` … `--7`, assigned by the
// type's position in `/config/` session_types.
export const TYPE_COLOUR_COUNT = 8;

const toColourModifier = (status?: string): string => (
  status && COLOURED_STATUSES.has(status) ? status : DEFAULT_COLOUR
);

export const isSessionPast = (session: CalendarSession): boolean => (
  new Date((session.scheduled_end_time || session.scheduled_start_time) as string) <= new Date()
);

export const hasSessionStarted = (session: CalendarSession): boolean => (
  new Date(session.scheduled_start_time as string) <= new Date()
);

export const isCancelled = (status?: string): boolean => status === SESSION_STATUS.CANCELLED;

/**
 * Display-only status: a session that has ended but was never explicitly
 * marked complete by the backend shows as "Completed".
 */
export const getDisplayStatus = (session: CalendarSession): string | undefined => (
  isSessionPast(session) && session.status === SESSION_STATUS.SCHEDULED
    ? SESSION_STATUS.COMPLETED
    : session.status
);

export const isSessionInstructor = (session: CalendarSession): boolean => session.user_role === USER_ROLE.INSTRUCTOR;

export const getSessionScope = (session: CalendarSession): SessionScope => {
  if (!(session.meeting_id || session.meeting_join_url)) { return 'in_person'; }
  return session.create_zoom_meeting ? 'public' : 'gated';
};

/** Hosts (admin or the session's instructor) start the meeting; the start link is fetched on demand. */
export const canStartMeeting = (session: CalendarSession, role: CalendarViewerRole): boolean => (
  !isSessionPast(session) && Boolean(session.meeting_id)
  && (role.canManageSessions || isSessionInstructor(session))
);

/** Edit/Cancel/Delete/Join row: hidden for cancelled sessions and for past ones outside the marking window. */
export const showsSessionActions = (session: CalendarSession): boolean => (
  !isCancelled(session.status) && (!isSessionPast(session) || Boolean(session.marking_window_open))
);

/**
 * Admin: full edit (past sessions open in correction mode, gated by the marking
 * window). Instructor: description-only edit on their own future sessions.
 */
export const canEditSession = (session: CalendarSession, role: CalendarViewerRole): boolean => (
  role.canManageSessions
  || (role.isInstructor && isSessionInstructor(session) && !hasSessionStarted(session))
);

/** Cancel and Delete only make sense for future sessions. */
export const canRemoveSession = (session: CalendarSession, role: CalendarViewerRole): boolean => (
  role.canManageSessions && !hasSessionStarted(session)
);

const learnerCanJoin = (session: CalendarSession, request?: CalendarRequest | null): boolean => Boolean(
  session.create_zoom_meeting
  || (request?.state === REQUEST_STATUS.APPROVED && request?.type === REQUEST_TYPE.REMOTE_SESSION),
);

/** The Join link for non-hosts, or null when there is none (or learners may not join). */
export const getJoinUrl = (
  session: CalendarSession,
  role: CalendarViewerRole,
  request?: CalendarRequest | null,
): string | null => {
  if (isSessionPast(session) || canStartMeeting(session, role)) { return null; }
  if (role.isLearner && !learnerCanJoin(session, request)) { return null; }
  const requestJoinUrl = request?.data?.meetings?.[String(session.id)]?.meeting_join_url;
  return session.my_join_url || session.meeting_join_url || requestJoinUrl || null;
};

export const openJoinUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

/** Chip/block background for a status (or the default grey). */
export const statusBgClass = (status?: string): string => `fbr-calendar-status-bg--${toColourModifier(status)}`;

/** The small status dot inside a chip or block (light shades, for dark chip backgrounds). */
export const statusDotClass = (status?: string): string => `fbr-calendar-status-dot--${toColourModifier(status)}`;

/** Chip background: the session type's colour when it has one, else the status colour. */
export const chipBgClass = (session: CalendarSession, sessionTypeColors?: Record<string, string>): string => (
  (sessionTypeColors && session.session_type && sessionTypeColors[session.session_type])
  || statusBgClass(session.status)
);
