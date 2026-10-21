import { ApiRecord } from '../../data/types';
import { Session } from '../../data/sessions/types';
import { StatusRequest } from '../RequestStatusBadge';

export interface ProgramCalendarContextValue {
  programKey: string;
  /** The host app's router path to this program, e.g. `/K` or `/programs/K`. */
  basePath: string;
}

export interface SessionLocation {
  id: number | string;
  name: string;
  description?: string | null;
  biometric_machine_serial_number?: string | null;
}

/** Zoom recurrence rules, as the sessions API stores them. */
export interface SessionRecurrence {
  /** 1 = daily, 2 = weekly, 3 = monthly. */
  type?: number;
  repeat_interval?: number;
  /** Comma-separated Zoom weekdays (1 = Sun … 7 = Sat). */
  weekly_days?: string;
  monthly_day?: number;
  monthly_week?: number;
  monthly_week_day?: number;
  end_times?: number;
  end_date_time?: string;
}

/** A session as the calendar endpoints return it. Every field is optional because payloads vary by role. */
export interface CalendarSession extends ApiRecord {
  id?: number;
  title?: string;
  description?: string | null;
  status?: string;
  session_type?: string | null;
  course_id?: string | null;
  course_name?: string | null;
  location?: SessionLocation | null;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  duration_minutes?: number | null;
  timezone?: string | null;
  platform?: string | null;
  is_recurring?: boolean;
  recurrence?: SessionRecurrence | null;
  instructor_names?: string[] | null;
  instructor_name?: string | null;
  instructor_emails?: string[] | null;
  create_zoom_meeting?: boolean;
  meeting_id?: string | null;
  meeting_join_url?: string | null;
  my_join_url?: string | null;
  meeting_password?: string | null;
  user_role?: string;
  my_request?: StatusRequest | null;
}

/** A saved session: editing needs its id. */
export interface ScheduleSession extends CalendarSession {
  id: number;
}

export interface CalendarHoliday {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface ProgramInfo {
  name?: string;
  city?: { name?: string } | null;
}

export interface SessionDetailModalProps {
  session?: CalendarSession | null;
  isOpen: boolean;
  onClose: () => void;
  /** Admin view: shows the roster and audit-log links and lets the viewer start the meeting. */
  canManageSessions?: boolean;
  /** `session_type` value → display label, from `/config/`. */
  sessionTypeLabels?: Record<string, string>;
}

export interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  programKey?: string;
  programInfo?: ProgramInfo | null;
  /** Called with the saved session after a create, update or correction. */
  onSuccess: (session: Session) => void;
  /** Omit to create; pass to edit (or correct, once the session has ended). */
  session?: ScheduleSession | null;
  holidays?: CalendarHoliday[];
  /** Instructor mode: only the description is editable. */
  descriptionOnly?: boolean;
}

export interface CalendarPdfDownloadButtonProps {
  sessions: CalendarSession[];
  rangeLabel: string;
  viewLabel?: string;
  programName?: string;
  sessionTypeLabels?: Record<string, string>;
}

/** One printed table row: every column is already a display string. */
export interface CalendarPdfRow {
  id: string;
  time: string;
  title: string;
  course: string;
  instructors: string;
  location: string;
  type: string;
  status: string;
}

export interface CalendarPdfDay {
  dateKey: string;
  label: string;
  sessionCount: number;
  rows: CalendarPdfRow[];
}

export interface CalendarPdfModel {
  title: string;
  programName: string;
  rangeLabel: string;
  viewLabel: string;
  days: CalendarPdfDay[];
  sessionCount: number;
  generatedAt: string;
}

export interface CalendarPdfModelOptions {
  sessions?: CalendarSession[];
  rangeLabel?: string;
  viewLabel?: string;
  programName?: string;
  sessionTypeLabels?: Record<string, string>;
  generatedAt?: Date;
}
