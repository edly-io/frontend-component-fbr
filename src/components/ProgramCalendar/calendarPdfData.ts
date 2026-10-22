import { bucketSessionsByDay } from '../../utils/dates';
import { formatInstructorNames, getSessionTypeLabel } from '../../utils/format';
import { SESSION_STATUS_LABELS } from '../../utils/constants';
import {
  CalendarPdfDay, CalendarPdfModel, CalendarPdfModelOptions, CalendarPdfRow, CalendarSession,
} from './types';

// The PDF is built from the same session objects the grid renders, so there is
// one source of truth for what a timetable contains. Everything below only
// reshapes those objects for a table layout.

const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
const PDF_TITLE = 'Session Timetable';
const UNTITLED_SESSION = 'Untitled session';
const FALLBACK_SLUG = 'export';

/**
 * "Monday, 3 Aug, 2026". Composed from parts rather than a single
 * toLocaleDateString() call: no locale produces day-before-month *and* a comma
 * before the year, so the order would otherwise follow whatever locale the
 * browser is set to.
 */
export const formatDayHeading = (date: Date): string => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday}, ${date.getDate()} ${month}, ${date.getFullYear()}`;
};

/** "3 Aug, 2026, 10:00 AM" — same day-first order as the day headings. */
const formatGeneratedAt = (date: Date): string => {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const time = date.toLocaleTimeString('en-US', TIME_OPTS);
  return `${date.getDate()} ${month}, ${date.getFullYear()}, ${time}`;
};

const formatTime = (value?: string | null): string => (
  value ? new Date(value).toLocaleTimeString('en-US', TIME_OPTS) : ''
);

/** "9:00 AM – 10:30 AM", or just the start when a session has no end time. */
export const formatSessionTimeRange = (session?: CalendarSession | null): string => {
  const start = formatTime(session?.scheduled_start_time);
  const end = formatTime(session?.scheduled_end_time);
  if (!start) { return ''; }
  return end ? `${start} – ${end}` : start;
};

/** A filename-safe slug, e.g. "Mar 1 – Mar 7, 2026" -> "mar-1-mar-7-2026". */
export const slugifyRange = (label?: string | null): string => (label || FALLBACK_SLUG)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || FALLBACK_SLUG;

export const buildPdfFilename = (rangeLabel?: string | null): string => `calendar-${slugifyRange(rangeLabel)}.pdf`;

const startTimeOf = (session: CalendarSession): number => new Date(session.scheduled_start_time as string).getTime();

const buildRow = (session: CalendarSession, sessionTypeLabels: Record<string, string>): CalendarPdfRow => ({
  id: String(session.id),
  time: formatSessionTimeRange(session),
  title: session.title || UNTITLED_SESSION,
  course: session.course_name || '',
  instructors: formatInstructorNames(session),
  location: session.location?.name || '',
  type: getSessionTypeLabel(session, sessionTypeLabels),
  status: (session.status && SESSION_STATUS_LABELS[session.status]) || session.status || '',
});

const buildDay = (
  dateKey: string,
  sessions: CalendarSession[],
  sessionTypeLabels: Record<string, string>,
): CalendarPdfDay => {
  const rows = sessions
    .slice()
    .sort((a, b) => startTimeOf(a) - startTimeOf(b))
    .map((session) => buildRow(session, sessionTypeLabels));
  // Midday avoids the date shifting a day in either direction when the
  // key is parsed back in a timezone with a non-zero offset.
  const date = new Date(`${dateKey}T12:00:00`);
  return {
    dateKey,
    label: formatDayHeading(date),
    sessionCount: rows.length,
    rows,
  };
};

/**
 * Reshape the calendar's sessions into the day-grouped rows the PDF table
 * renders. Sessions arrive already scoped to the window and role the UI is
 * showing, so no filtering happens here beyond ordering.
 */
export const buildCalendarPdfModel = ({
  sessions = [],
  rangeLabel = '',
  viewLabel = '',
  programName = '',
  sessionTypeLabels = {},
  generatedAt = new Date(),
}: CalendarPdfModelOptions = {}): CalendarPdfModel => {
  const byDay = bucketSessionsByDay(sessions);
  const days = Array.from(byDay.keys())
    .sort()
    .map((dateKey) => buildDay(dateKey, byDay.get(dateKey) ?? [], sessionTypeLabels));

  return {
    title: PDF_TITLE,
    programName,
    rangeLabel,
    viewLabel,
    days,
    sessionCount: days.reduce((total, day) => total + day.rows.length, 0),
    generatedAt: formatGeneratedAt(generatedAt),
  };
};
