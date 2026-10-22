export interface LeaveDates {
  leave_start_date?: string | null;
  leave_end_date?: string | null;
}

export interface TimedSession {
  scheduled_start_time?: string | null;
}

export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) { return ''; }
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toISOString = (dateTimeLocalString?: string | null): string => {
  if (!dateTimeLocalString) { return ''; }
  return new Date(dateTimeLocalString).toISOString();
};

export const toDateTimeLocal = (isoString?: string | null): string => {
  if (!isoString) { return ''; }
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

/**
 * True when a leave request's start date is strictly before today.
 * Date-only comparison (ignores time-of-day) so "today" is never "passed",
 * mirroring the backend's `leave_start_date < now().date()` rule.
 */
export const isLeaveStartDatePast = (req?: LeaveDates | null): boolean => {
  if (!req || !req.leave_start_date) { return false; }
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (local)
  return req.leave_start_date < today;
};

/** Format a date-only value (YYYY-MM-DD) as e.g. "Jul 10, 2026". */
export const formatLeaveDate = (value?: string | null): string => {
  if (!value) { return ''; }
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/** Human date range for a leave: single date, or "start – end". */
export const formatLeaveRange = (req?: LeaveDates | null): string => {
  if (!req || !req.leave_start_date) { return ''; }
  const start = formatLeaveDate(req.leave_start_date);
  if (!req.leave_end_date || req.leave_end_date === req.leave_start_date) { return start; }
  return `${start} – ${formatLeaveDate(req.leave_end_date)}`;
};

/**
 * Format a Date as a local calendar day string (YYYY-MM-DD).
 *
 * Uses the browser's local timezone (PKT for our users), so midnight-local
 * dates keep their intended day. Do NOT use `toISOString().slice(0, 10)` for
 * this: it converts to UTC first and rolls a midnight-local date back to the
 * previous day in any positive-offset timezone — the calendar-window bug.
 */
export const toLocalDateStr = (d: Date): string => d.toLocaleDateString('en-CA'); // YYYY-MM-DD (local)

/**
 * Group an array of sessions into a Map keyed by local date string (YYYY-MM-DD).
 * Each session appears under its start day in the user's local timezone.
 */
export const bucketSessionsByDay = <T extends TimedSession>(sessions: T[]): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  sessions.forEach((session) => {
    if (!session.scheduled_start_time) { return; }
    const key = new Date(session.scheduled_start_time).toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (!map.has(key)) { map.set(key, []); }
    map.get(key)!.push(session);
  });
  return map;
};
