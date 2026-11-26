import { CalendarSession, CalendarViewMode } from './types';

export const CALENDAR_VIEWS: Record<'MONTH' | 'WEEK' | 'DAY', CalendarViewMode> = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
};

// Sun(0) first, matching JS getDay() order.
export const WEEK_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAYS_IN_WEEK = 7;
const SUNDAY = 0;
const SATURDAY = 6;

/** Returns a local date string YYYY-MM-DD for any Date object. */
export const toDateKey = (date: Date): string => date.toLocaleDateString('en-CA');

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Returns the Sunday that starts the week containing `date`. */
const getWeekStart = (date: Date): Date => startOfDay(addDays(date, -date.getDay()));

/** Returns the 7 Date objects (Sun–Sat) of the week containing `date`. */
export const getWeekDays = (date: Date): Date[] => {
  const start = getWeekStart(date);
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(start, i));
};

/** Returns all Date objects for the 4–6 week grid rows of a month view. */
export const getMonthGridDays = (date: Date): Date[] => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  // Weeks run Sun–Sat, so the grid ends on the Saturday of the last day's week.
  const endDay = addDays(lastDay, SATURDAY - lastDay.getDay());

  const days: Date[] = [];
  for (let cursor = getWeekStart(firstDay); cursor <= endDay; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
};

export const isWeekendDay = (date: Date): boolean => date.getDay() === SUNDAY || date.getDay() === SATURDAY;

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Formats a date range label for the toolbar. */
export const formatRangeLabel = (view: CalendarViewMode, date: Date): string => {
  if (view === CALENDAR_VIEWS.MONTH) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (view === CALENDAR_VIEWS.DAY) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
    });
  }
  const days = getWeekDays(date);
  const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end}`;
};

const getVisibleDays = (view: CalendarViewMode, currentDate: Date): Date[] => {
  if (view === CALENDAR_VIEWS.MONTH) { return getMonthGridDays(currentDate); }
  if (view === CALENDAR_VIEWS.WEEK) { return getWeekDays(currentDate); }
  return [currentDate];
};

/**
 * The [start, end) window the calendar currently shows.
 * Month → full grid (Sunday before the 1st → Saturday after the last day)
 * Week  → Sunday → following Sunday
 * Day   → start of day → start of next day
 */
export const computeFetchWindow = (view: CalendarViewMode, currentDate: Date): { start: Date; end: Date } => {
  const days = getVisibleDays(view, currentDate);
  const start = startOfDay(days[0]);
  const end = startOfDay(addDays(days[days.length - 1], 1));
  return { start, end };
};

/** The date `direction` periods (months, weeks or days) away from `date`. */
/** Same day of the month `months` away, clamped to that month's last day (31 Jan + 1 → 28/29 Feb). */
export const addMonthsClamped = (date: Date, months: number): Date => {
  const firstOfTarget = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate();
  firstOfTarget.setDate(Math.min(date.getDate(), lastDay));
  return firstOfTarget;
};

export const shiftDate = (view: CalendarViewMode, date: Date, direction: number): Date => {
  if (view === CALENDAR_VIEWS.MONTH) {
    return addMonthsClamped(date, direction);
  }
  return addDays(date, view === CALENDAR_VIEWS.WEEK ? direction * DAYS_IN_WEEK : direction);
};

export const getToday = (): Date => startOfDay(new Date());

// A day is today, a holiday, a weekend, or neither. Both the cell's ground and
// the day-name colour follow from that, so it is a modifier rather than a value.
export const dayVariant = (isToday: boolean, isWeekend: boolean, isHoliday = false): string => {
  if (isToday) { return 'today'; }
  if (isHoliday) { return 'holiday'; }
  if (isWeekend) { return 'weekend'; }
  return 'plain';
};

/** "Wed, Oct 14, 10:00 AM – 11:00 AM" for popovers. */
export const formatTimeRange = (session: CalendarSession): string => {
  const start = new Date(session.scheduled_start_time as string);
  const startLabel = start.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  if (!session.scheduled_end_time) { return startLabel; }
  const end = new Date(session.scheduled_end_time);
  const endLabel = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} – ${endLabel}`;
};

export const formatShortTime = (date: Date): string => (
  date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
);
