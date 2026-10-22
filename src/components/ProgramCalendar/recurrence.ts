import { SessionRecurrence } from './types';

// Recurrence rules for a new session series, in Zoom's terms. The form keeps
// them as RecurrenceState; buildRecurrence turns that into the API payload.

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';
export type MonthlyMode = 'day' | 'week';
export type RecurrenceEndType = 'count' | 'date';

export interface RecurrenceState {
  recurrenceType: RecurrenceType;
  /** Zoom weekdays (1 = Sun … 7 = Sat). */
  weeklyDays: number[];
  monthlyMode: MonthlyMode;
  monthlyDay: number;
  monthlyWeek: number;
  monthlyWeekDay: number;
  endType: RecurrenceEndType;
  endCount: number;
  /** YYYY-MM-DD. */
  endDate: string;
}

export const RECURRENCE_TYPES: Array<{ value: RecurrenceType; label: string }> = [
  { value: 'daily', label: 'day' },
  { value: 'weekly', label: 'week' },
  { value: 'monthly', label: 'month' },
];

// Sun–Sat weekday buttons — Zoom weekday numbers (Sun=1 … Sat=7)
export const ALL_WEEK_DAYS = [
  { value: 1, letter: 'S', fullName: 'Sunday' },
  { value: 2, letter: 'M', fullName: 'Monday' },
  { value: 3, letter: 'T', fullName: 'Tuesday' },
  { value: 4, letter: 'W', fullName: 'Wednesday' },
  { value: 5, letter: 'T', fullName: 'Thursday' },
  { value: 6, letter: 'F', fullName: 'Friday' },
  { value: 7, letter: 'S', fullName: 'Saturday' },
];

export const MONTHLY_WEEKS = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
];

export const MAX_END_COUNT = 30; // We cap at 30; Zoom's absolute hard limit is 60
export const MAX_END_MONTHS = 2; // End date can be at most 2 months from session start
/** Days 29–31 don't exist in every month, so they only allow the weekday pattern. */
export const LAST_SAFE_MONTH_DAY = 28;

const ZOOM_TYPE = { daily: 1, weekly: 2, monthly: 3 } as const;
const DEFAULT_ZOOM_WEEKDAY = 2; // Monday
const DEFAULT_END_COUNT = 10;
const DAYS_PER_WEEK = 7;
const MAX_MONTH_WEEK = 4;

export const DEFAULT_RECURRENCE: RecurrenceState = {
  recurrenceType: 'weekly',
  weeklyDays: [DEFAULT_ZOOM_WEEKDAY],
  monthlyMode: 'day',
  monthlyDay: 1,
  monthlyWeek: 1,
  monthlyWeekDay: DEFAULT_ZOOM_WEEKDAY,
  endType: 'count',
  endCount: DEFAULT_END_COUNT,
  endDate: '',
};

/** Returns the ISO date string (YYYY-MM-DD) that is MAX_END_MONTHS months after startDateString. */
export const getMaxEndDate = (startDateString: string): string => {
  if (!startDateString) { return ''; }
  const d = new Date(startDateString);
  d.setMonth(d.getMonth() + MAX_END_MONTHS);
  return d.toISOString().slice(0, 10);
};

/** Returns the Zoom weekday number (1=Sun … 7=Sat) for a datetime-local string. */
const getZoomWeekdayFromDate = (dateString: string): number => new Date(dateString).getDay() + 1;

/** Returns which week-of-month the date falls on (1–4). */
const getMonthWeekFromDate = (dateString: string): number => (
  Math.min(MAX_MONTH_WEEK, Math.ceil(new Date(dateString).getDate() / DAYS_PER_WEEK))
);

const getLocalDateString = (isoString: string): string => new Date(isoString).toISOString().slice(0, 10);

/** The weekday/day-of-month defaults a new series takes from its start date. */
export const seedRecurrenceFromStart = (baseDateTime: string): Partial<RecurrenceState> => {
  const weekday = getZoomWeekdayFromDate(baseDateTime);
  const day = new Date(baseDateTime).getDate();
  const seeded: Partial<RecurrenceState> = {
    weeklyDays: [weekday],
    monthlyDay: day,
    monthlyWeek: getMonthWeekFromDate(baseDateTime),
    monthlyWeekDay: weekday,
  };
  // Day 29-31 doesn't exist in all months — force the safer weekday pattern
  if (day > LAST_SAFE_MONTH_DAY) { seeded.monthlyMode = 'week'; }
  return seeded;
};

const recurrenceTypeFromZoom = (type: number): RecurrenceType => {
  if (type === ZOOM_TYPE.daily) { return 'daily'; }
  if (type === ZOOM_TYPE.monthly) { return 'monthly'; }
  return 'weekly';
};

const parseWeeklyDays = (weeklyDays?: string): number[] => {
  const days = (weeklyDays || '')
    .split(',')
    .map((d) => parseInt(d, 10))
    .filter((d) => Number.isInteger(d));
  return days.length ? days : [DEFAULT_ZOOM_WEEKDAY];
};

const parseMonthly = (recurrence: SessionRecurrence): Partial<RecurrenceState> => {
  if (recurrence.monthly_day) {
    return { monthlyMode: 'day', monthlyDay: recurrence.monthly_day };
  }
  return {
    monthlyMode: 'week',
    monthlyWeek: recurrence.monthly_week || 1,
    monthlyWeekDay: recurrence.monthly_week_day || DEFAULT_ZOOM_WEEKDAY,
  };
};

const parseEnd = (recurrence: SessionRecurrence): Partial<RecurrenceState> => {
  if (recurrence.end_times) {
    return { endType: 'count', endCount: recurrence.end_times, endDate: '' };
  }
  if (recurrence.end_date_time) {
    return { endType: 'date', endDate: getLocalDateString(recurrence.end_date_time) };
  }
  // Fallback: default to 10 occurrences
  return { endType: 'count', endCount: DEFAULT_END_COUNT };
};

/** The form state for a saved session's rules (edit mode). */
export const recurrenceFromSession = (recurrence: SessionRecurrence): RecurrenceState => {
  const type = recurrence.type || ZOOM_TYPE.weekly;
  return {
    ...DEFAULT_RECURRENCE,
    recurrenceType: recurrenceTypeFromZoom(type),
    ...(type === ZOOM_TYPE.weekly ? { weeklyDays: parseWeeklyDays(recurrence.weekly_days) } : {}),
    ...(type === ZOOM_TYPE.monthly ? parseMonthly(recurrence) : {}),
    ...parseEnd(recurrence),
  };
};

/** The API's recurrence payload for a new series. */
export const buildRecurrence = (state: RecurrenceState): SessionRecurrence => {
  const recurrence: SessionRecurrence = { repeat_interval: 1 };
  if (state.recurrenceType === 'daily') {
    // type 1 = Zoom daily recurrence — every day, weekends included.
    recurrence.type = ZOOM_TYPE.daily;
  } else if (state.recurrenceType === 'weekly') {
    recurrence.type = ZOOM_TYPE.weekly;
    recurrence.weekly_days = [...state.weeklyDays]
      .filter((d) => d >= 1 && d <= DAYS_PER_WEEK)
      .sort((a, b) => a - b)
      .join(',');
  } else {
    recurrence.type = ZOOM_TYPE.monthly;
    if (state.monthlyMode === 'day') {
      recurrence.monthly_day = state.monthlyDay;
    } else {
      recurrence.monthly_week = state.monthlyWeek;
      recurrence.monthly_week_day = state.monthlyWeekDay;
    }
  }
  if (state.endType === 'count') {
    recurrence.end_times = state.endCount;
  } else {
    recurrence.end_date_time = new Date(`${state.endDate}T23:59:59`).toISOString();
  }
  return recurrence;
};

export const getWeekdayName = (value: number): string => ALL_WEEK_DAYS.find((d) => d.value === value)?.fullName ?? '';
export const getMonthWeekLabel = (value: number): string => MONTHLY_WEEKS.find((w) => w.value === value)?.label ?? '';

const describePattern = (state: RecurrenceState): string => {
  if (state.recurrenceType === 'daily') { return 'Every day'; }
  if (state.recurrenceType === 'weekly') {
    if (!state.weeklyDays.length) { return ''; }
    return `Every ${state.weeklyDays.map(getWeekdayName).filter(Boolean).join(' and ')}`;
  }
  if (state.monthlyMode === 'day') { return `Day ${state.monthlyDay} of every month`; }
  return `${getMonthWeekLabel(state.monthlyWeek)} ${getWeekdayName(state.monthlyWeekDay)} of every month`;
};

/** Builds a human-readable summary shown below the recurrence panel. */
export const buildSummary = (state: RecurrenceState): string => {
  const pattern = describePattern(state);
  if (!pattern) { return ''; }
  if (state.endType === 'count') {
    return `${pattern} • ${state.endCount} session${state.endCount !== 1 ? 's' : ''}`;
  }
  if (state.endDate) {
    const formatted = new Date(`${state.endDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${pattern} • until ${formatted}`;
  }
  return pattern;
};
