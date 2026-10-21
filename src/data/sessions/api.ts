import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getAttendanceApiUrl } from '../urls';
import { ApiRecord } from '../types';
import {
  CalendarSessions, ProgramDateEvent, Session, SessionApprovedLeavesParams, SessionListParams,
} from './types';

const listFrom = <T>(data: T[] | { results?: T[] }): T[] => (
  Array.isArray(data) ? data : (data.results ?? [])
);

export const getSession = async (sessionId: number | string): Promise<Session> => {
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`sessions/${sessionId}/`));
  return data;
};

export const createSession = async (sessionData: ApiRecord): Promise<Session> => {
  const { data } = await getAuthenticatedHttpClient().post(getAttendanceApiUrl('sessions/'), sessionData);
  return data;
};

export const updateSession = async (sessionId: number | string, sessionData: ApiRecord): Promise<Session> => {
  const { data } = await getAuthenticatedHttpClient().patch(
    getAttendanceApiUrl(`sessions/${sessionId}/`),
    sessionData,
  );
  return data;
};

// Fetch a fresh Zoom host start link on demand. The start URL embeds a host
// token and expires ~2h after Zoom generates it, so it is never stored, cached
// or sent in list payloads — the host (admin or the session's instructor)
// fetches it at click time.
export const getSessionStartLink = async (sessionId: number | string): Promise<string> => {
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`sessions/${sessionId}/start-link/`));
  return data.start_url;
};

// Soft-cancel: preserves the session row and Zoom meeting for audit/rescheduling.
export const cancelSession = async (sessionId: number | string): Promise<Session> => {
  const { data } = await getAuthenticatedHttpClient().post(getAttendanceApiUrl(`sessions/${sessionId}/cancel/`));
  return data;
};

// Hard delete. Blocked by the backend for sessions that have already started,
// completed, or are in progress — use cancelSession for those.
export const deleteSession = async (sessionId: number | string): Promise<void> => {
  await getAuthenticatedHttpClient().delete(getAttendanceApiUrl(`sessions/${sessionId}/`));
};

/**
 * Correct the course assignment and/or instructors on a past session.
 * Admin-only. Only `course_id` and `instructor_emails` are accepted; no Zoom
 * sync and no immutability guard apply.
 */
export const correctSession = async (sessionId: number | string, correctionData: ApiRecord): Promise<Session> => {
  const { data } = await getAuthenticatedHttpClient().patch(
    getAttendanceApiUrl(`sessions/${sessionId}/`),
    correctionData,
  );
  return data;
};

interface ProgramDatesCourse {
  course_key: string;
  course_name: string;
  date_blocks?: Array<{
    title: string;
    date: string;
    link?: string;
    assignment_type?: string | null;
    complete?: boolean | null;
  }>;
}

/**
 * Graded subsection due dates for every course in a program, flattened into
 * one list. Not windowed — returns all dates for the whole program.
 */
export const getProgramDates = async (programKey: string): Promise<ProgramDateEvent[]> => {
  const { data } = await getAuthenticatedHttpClient().get(
    getAttendanceApiUrl(`program-dates/?program_key=${encodeURIComponent(programKey)}`),
  );
  const courses: ProgramDatesCourse[] = data.courses || [];
  return courses.flatMap((course) => (course.date_blocks || []).map((block) => ({
    id: `${course.course_key}::${block.title}`,
    courseKey: course.course_key,
    courseName: course.course_name,
    title: block.title,
    date: block.date,
    link: block.link || '',
    assignmentType: block.assignment_type || null,
    complete: block.complete ?? null,
  })));
};

/**
 * Sessions within a date window for the calendar UI. The window must be
 * 45 days or less; visibility is role-scoped on the backend.
 */
export const getCalendarSessions = async (
  startDate: string,
  endDate: string,
  programKey = '',
): Promise<CalendarSessions> => {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  if (programKey) { params.set('program_key', programKey); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`calendar-sessions/?${params}`));
  return { sessions: data.results, userRole: data.user_role };
};

/** Sessions in a date range, scoped to the caller's role (used by the leave panels). */
export const getSessions = async (
  { program_key, start_date, end_date }: SessionListParams = {},
): Promise<Session[]> => {
  const params = new URLSearchParams({ start_date: start_date ?? '', end_date: end_date ?? '' });
  if (program_key) { params.set('program_key', program_key); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`sessions/?${params}`));
  return listFrom<Session>(data);
};

/** Sessions with their approved-leave attendees, server-side paginated. */
export const getSessionApprovedLeaves = async ({
  program_key, q, page, page_size, date_from, date_to,
}: SessionApprovedLeavesParams = {}): Promise<ApiRecord> => {
  const params = new URLSearchParams();
  if (program_key) { params.set('program_key', program_key); }
  if (q) { params.set('q', q); }
  if (page) { params.set('page', String(page)); }
  if (page_size) { params.set('page_size', String(page_size)); }
  if (date_from) { params.set('date_from', date_from); }
  if (date_to) { params.set('date_to', date_to); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`sessions/approved-leaves/?${params}`));
  return data;
};
