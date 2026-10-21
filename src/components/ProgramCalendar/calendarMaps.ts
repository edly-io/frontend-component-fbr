// Lookup maps the calendar grid reads by day or by session.

import { ProgramDateEvent } from '../../data/sessions/types';
import { REQUEST_STATUS, REQUEST_TYPE } from '../../utils/constants';
import { toDateKey } from './calendarDates';
import { TYPE_COLOUR_COUNT } from './sessionDisplay';
import {
  ApprovedLeave, CalendarHoliday, CalendarSession, LeaveDateMap, StudentRequestMap,
} from './types';

const FULL_DAY_LEAVE_TYPES = ['full_day', 'full'];

export interface SessionTypeOption {
  value?: string;
  label?: string;
}

const pushToSlot = <T>(map: Map<string, T[]>, key: string, item: T) => {
  const slot = map.get(key);
  if (slot) { slot.push(item); } else { map.set(key, [item]); }
};

/** Local date → the graded due dates on it. */
export const buildProgramDatesMap = (programDates: ProgramDateEvent[]): Map<string, ProgramDateEvent[]> => {
  const map = new Map<string, ProgramDateEvent[]>();
  programDates.forEach((event) => pushToSlot(map, toDateKey(new Date(event.date)), event));
  return map;
};

/** Local date → every holiday covering it (holidays span start_date..end_date inclusive). */
export const buildHolidayMap = (holidays: CalendarHoliday[]): Map<string, CalendarHoliday[]> => {
  const map = new Map<string, CalendarHoliday[]>();
  holidays.forEach((holiday) => {
    const cur = new Date(`${holiday.start_date}T00:00:00`);
    const last = new Date(`${holiday.end_date}T00:00:00`);
    while (cur <= last) {
      pushToSlot(map, toDateKey(cur), holiday);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
};

const isApproved = (leave: ApprovedLeave): boolean => !leave.state || leave.state === REQUEST_STATUS.APPROVED;

const hasLinkedSessions = (leave: ApprovedLeave): boolean => Boolean(leave.sessions && leave.sessions.length > 0);

const sessionsInLeaveRange = (leave: ApprovedLeave, sessions: CalendarSession[]): CalendarSession[] => {
  const leaveStart = new Date(`${leave.leave_start_date}T00:00:00`);
  const leaveEnd = new Date(`${leave.leave_end_date}T23:59:59`);
  return sessions.filter((session) => {
    if (!session.scheduled_start_time) { return false; }
    const sessionDate = new Date(session.scheduled_start_time);
    return sessionDate >= leaveStart && sessionDate <= leaveEnd;
  });
};

/**
 * Session id → the viewer's approved leave covering it.
 * Session-specific leaves map each linked session directly. Full-day leaves
 * (leave_start_date/leave_end_date set, no sessions) cover every loaded session
 * whose start falls in the date range.
 */
export const buildStudentRequestMap = (
  approvedLeaves: ApprovedLeave[],
  sessions: CalendarSession[],
): StudentRequestMap => {
  const map: StudentRequestMap = new Map();
  approvedLeaves.filter(isApproved).forEach((leave) => {
    const linkedSessions = leave.sessions ?? [];
    if (linkedSessions.length > 0) {
      linkedSessions.forEach((s) => { map.set(s.id, leave); });
    } else if (leave.leave_start_date && leave.leave_end_date) {
      sessionsInLeaveRange(leave, sessions).forEach((s) => { map.set(s.id as number, leave); });
    }
  });
  // Supplement with session.my_request — covers session-specific leaves where
  // the leave list serializer may not return nested session objects. Only leave
  // requests belong here; remote session requests must not trigger the
  // grey/strikethrough overlay.
  sessions.forEach((s) => {
    if (
      !map.has(s.id as number)
      && s.my_request?.state === REQUEST_STATUS.APPROVED
      && s.my_request?.type === REQUEST_TYPE.LEAVE
    ) {
      map.set(s.id as number, s.my_request);
    }
  });
  return map;
};

const isFullDayLeave = (leave: ApprovedLeave): boolean => (
  FULL_DAY_LEAVE_TYPES.includes(leave.leave_type ?? '')
  || (!leave.leave_type && !hasLinkedSessions(leave))
);

/**
 * Local date (YYYY-MM-DD) → the full-day leave covering it, for the "On Leave"
 * day banner. Session-specific leaves are excluded: those sessions already get
 * the grey/strikethrough treatment via the student request map.
 */
export const buildLeaveDateMap = (approvedLeaves: ApprovedLeave[]): LeaveDateMap => {
  const map: LeaveDateMap = new Map();
  approvedLeaves.filter(isApproved).forEach((leave) => {
    if (!leave.leave_start_date || !leave.leave_end_date || !isFullDayLeave(leave)) { return; }
    const cur = new Date(`${leave.leave_start_date}T12:00:00`);
    const last = new Date(`${leave.leave_end_date}T12:00:00`);
    while (cur <= last) {
      map.set(cur.toISOString().slice(0, 10), leave);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
};

/** `session_type` value → chip colour class, cycling through the palette in config order. */
export const buildSessionTypeColors = (types: SessionTypeOption[]): Record<string, string> => {
  const map: Record<string, string> = {};
  types.forEach((type, i) => {
    map[type.value as string] = `fbr-calendar-type-bg--${i % TYPE_COLOUR_COUNT}`;
  });
  return map;
};

/** `session_type` value → display label. */
export const buildSessionTypeLabels = (types: SessionTypeOption[]): Record<string, string> => {
  const map: Record<string, string> = {};
  types.forEach((type) => {
    if (type?.value && type?.label) {
      map[type.value] = type.label;
    }
  });
  return map;
};
