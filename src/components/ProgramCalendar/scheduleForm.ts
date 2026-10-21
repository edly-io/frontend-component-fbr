import { SelectOption } from '../SearchableSelect';
import { ApiRecord } from '../../data/types';
import { toDateTimeLocal, toISOString } from '../../utils/dates';
import {
  buildRecurrence, DEFAULT_RECURRENCE, recurrenceFromSession, RecurrenceState,
} from './recurrence';
import { ScheduleSession } from './types';

// Form state of the schedule modal and the payloads it sends.

export const DEFAULT_SESSION_TYPE = 'session';

export interface ScheduleFormState {
  title: string;
  description: string;
  /** YYYY-MM-DD and HH:mm, as the date and time pickers hold them. */
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  sessionType: string;
  /**
   * When off, the session is in-person/manual. Remote learners request personal
   * Zoom links through the session-request approval flow instead. Captured on
   * create only; the backend makes it read-only on updates.
   */
  createZoomMeeting: boolean;
  isRecurring: boolean;
  recurrence: RecurrenceState;
  location: SelectOption | null;
}

export const EMPTY_FORM: ScheduleFormState = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  sessionType: DEFAULT_SESSION_TYPE,
  createZoomMeeting: false,
  isRecurring: false,
  recurrence: DEFAULT_RECURRENCE,
  location: null,
};

/** The fields cleared after a successful save. */
export const CLEARED_AFTER_SAVE: Partial<ScheduleFormState> = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
};

const splitDateTimeLocal = (dateTimeLocalString: string) => {
  if (!dateTimeLocalString) { return { date: '', time: '' }; }
  const [date, time] = dateTimeLocalString.split('T');
  return { date: date || '', time: (time || '').slice(0, 5) };
};

export const combineDateTimeLocal = (date: string, time: string): string => (date && time ? `${date}T${time}` : '');

/** The form as it opens: empty for a new session, filled from the session when editing. */
export const getInitialForm = (session?: ScheduleSession | null): ScheduleFormState => {
  if (!session) { return EMPTY_FORM; }
  const start = splitDateTimeLocal(toDateTimeLocal(session.scheduled_start_time));
  const end = splitDateTimeLocal(toDateTimeLocal(session.scheduled_end_time));
  const recurrence = session.recurrence || {};
  const isRecurring = Boolean(session.is_recurring || Object.keys(recurrence).length > 0);
  return {
    title: session.title || '',
    description: session.description || '',
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    sessionType: session.session_type || DEFAULT_SESSION_TYPE,
    createZoomMeeting: Boolean(session.create_zoom_meeting),
    isRecurring,
    recurrence: isRecurring ? recurrenceFromSession(recurrence) : DEFAULT_RECURRENCE,
    location: session.location ? { value: session.location.id, label: session.location.name } : null,
  };
};

/**
 * The course to preselect when editing. In description-only mode the options
 * list is never fetched, so the option is built from the session itself.
 */
export const findPrefillCourse = (
  session: ScheduleSession,
  courseOptions: SelectOption[],
  descriptionOnly: boolean,
): SelectOption | null => {
  if (descriptionOnly) {
    if (!session.course_id) { return null; }
    return { value: String(session.course_id), label: session.course_name || String(session.course_id) };
  }
  const targetId = String(session.course_id);
  if (!targetId) { return null; }
  return courseOptions.find((r) => r.value === targetId) ?? null;
};

/**
 * The instructors to preselect when editing, in the session's order. In
 * description-only mode they are built from the session's names and emails.
 */
export const findPrefillInstructors = (
  session: ScheduleSession,
  instructorOptions: SelectOption[],
  descriptionOnly: boolean,
): SelectOption[] => {
  const emails = session.instructor_emails || [];
  if (descriptionOnly) {
    return (session.instructor_names || []).map((name, i) => ({
      value: emails[i] || name,
      label: name,
      email: emails[i] || '',
    }));
  }
  return emails
    .map((email) => instructorOptions.find((i) => i.email === email))
    .filter((option): option is SelectOption => Boolean(option));
};

const sortedJoin = (values: unknown[]): string => values.slice().sort().join(',');

/**
 * The correction diff for a past session: only the course, instructors and
 * location that actually changed. Empty when nothing changed.
 */
export const buildCorrectionPayload = (
  session: ScheduleSession,
  course: SelectOption,
  instructors: SelectOption[],
  location: SelectOption | null,
): ApiRecord => {
  const payload: ApiRecord = {};
  const newCourseId = course.value;
  if (newCourseId !== String(session.course_id)) { payload.course_id = newCourseId; }
  const newEmails = instructors.map((i) => i.email);
  if (sortedJoin(newEmails) !== sortedJoin(session.instructor_emails || [])) {
    payload.instructor_emails = newEmails;
  }
  const newLocationId = location?.value ?? null;
  const originalLocationId = session.location?.id ?? null;
  if (newLocationId !== originalLocationId) { payload.location_id = newLocationId; }
  return payload;
};

interface SessionPayloadInput {
  programKey: string;
  form: ScheduleFormState;
  course: SelectOption | null;
  instructors: SelectOption[];
  isNewSession: boolean;
}

/** The full create/update payload for an upcoming session. */
export const buildSessionPayload = ({
  programKey, form, course, instructors, isNewSession,
}: SessionPayloadInput): ApiRecord => {
  const payload: ApiRecord = {
    program_key: programKey,
    session_type: form.sessionType,
    course_id: course?.value || null,
    title: form.title,
    description: form.description,
    scheduled_start_time: toISOString(combineDateTimeLocal(form.startDate, form.startTime)),
    scheduled_end_time: toISOString(combineDateTimeLocal(form.endDate, form.endTime)),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    instructor_emails: instructors.map((i) => i.email),
    location_id: form.location?.value || null,
    create_zoom_meeting: form.createZoomMeeting,
  };
  // Recurrence is fixed at creation. An edit applies to the single
  // occurrence being edited, so resending the series rules would only
  // misrepresent what the request does.
  if (isNewSession) {
    payload.is_recurring = form.isRecurring;
    if (form.isRecurring) { payload.recurrence = buildRecurrence(form.recurrence); }
  }
  return payload;
};
