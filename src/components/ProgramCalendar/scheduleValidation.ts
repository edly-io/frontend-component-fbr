import { SelectOption } from '../SearchableSelect';
import { ApiRecord } from '../../data/types';
import {
  getMaxEndDate, MAX_END_COUNT, MAX_END_MONTHS, RecurrenceState,
} from './recurrence';
import { CalendarHoliday } from './types';

// Client-side checks for the schedule form. Each returns the message to show,
// or '' when the input is fine. The backend validates everything again.

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60 * 1000;
const SUNDAY = 0;
const SATURDAY = 6;
const MAX_MONTH_DAY = 31;

export interface ScheduleValidationInput {
  isPastSession: boolean;
  isSessionType: boolean;
  title: string;
  hasCourse: boolean;
  instructorCount: number;
  hasLocation: boolean;
  /** datetime-local strings ('' when incomplete). */
  scheduledStart: string;
  scheduledEnd: string;
  startDate: string;
  /** Allowed lecture lengths from /config/; null skips the check. */
  lectureDurations: number[] | null;
  isRecurring: boolean;
  recurrence: RecurrenceState;
  instructorLeaveError: string;
}

/** Renders a minute count the way the messages read: 90 → "1 hour 30 minutes". */
export const humanizeMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const remainingMinutes = minutes % MINUTES_PER_HOUR;
  const parts: string[] = [];
  if (hours) { parts.push(`${hours} hour${hours > 1 ? 's' : ''}`); }
  if (remainingMinutes) { parts.push(`${remainingMinutes} minutes`); }
  return parts.join(' ');
};

/**
 * Returns why this duration is invalid for this session type, or '' if it is
 * fine. An in-class lecture must land on one of the fixed teaching slots; every
 * other type is a free-form event of any length. The check is skipped when the
 * config call has not landed — the backend validates either way.
 */
export const getDurationError = (
  durationMinutes: number,
  isLecture: boolean,
  lectureSlots: number[] | null,
): string => {
  if (!isLecture || !lectureSlots || lectureSlots.includes(durationMinutes)) { return ''; }
  const rendered = lectureSlots.map(humanizeMinutes);
  return `Session duration must be ${rendered.slice(0, -1).join(', ')}, or ${rendered[rendered.length - 1]}`;
};

const validateRequiredFields = (input: ScheduleValidationInput): string => {
  const { isPastSession, isSessionType } = input;
  if (!isPastSession && !input.title.trim()) { return 'Title is required'; }
  if (isSessionType && !input.hasCourse) { return 'Course is required for this session type'; }
  if (isSessionType && input.instructorCount === 0) {
    return 'At least one instructor is required for this session type';
  }
  if (!isPastSession && isSessionType && !input.hasLocation) { return 'Location is required for this session type'; }
  if (!isPastSession && !input.scheduledStart) { return 'Start time is required'; }
  if (!isPastSession && !input.scheduledEnd) { return 'End time is required'; }
  return '';
};

const validateTimes = (input: ScheduleValidationInput): string => {
  const start = new Date(input.scheduledStart);
  const end = new Date(input.scheduledEnd);
  if (end <= start) { return 'End time must be after start time'; }
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / MS_PER_MINUTE);
  const durationError = getDurationError(durationMinutes, input.isSessionType, input.lectureDurations);
  if (durationError) { return durationError; }
  if (start <= new Date()) { return 'Start time must be in the future'; }
  return '';
};

const validateRecurrenceEndDate = (input: ScheduleValidationInput): string => {
  const { endDate } = input.recurrence;
  const startDateForRange = input.scheduledStart || (input.startDate ? `${input.startDate}T00:00` : '');
  const startDateOnly = startDateForRange ? new Date(startDateForRange).toISOString().slice(0, 10) : '';
  if (startDateOnly && endDate < startDateOnly) { return 'End date must be after the start date'; }
  const maxDate = getMaxEndDate(startDateForRange);
  if (maxDate && endDate > maxDate) {
    return `End date cannot be more than ${MAX_END_MONTHS} months from the start date.`;
  }
  return '';
};

const validateRecurrence = (input: ScheduleValidationInput): string => {
  const {
    recurrenceType, weeklyDays, monthlyMode, monthlyDay, endType, endCount, endDate,
  } = input.recurrence;
  if (recurrenceType === 'weekly' && weeklyDays.length === 0) { return 'Select at least one weekday'; }
  if (recurrenceType === 'monthly' && monthlyMode === 'day' && (!monthlyDay || monthlyDay < 1 || monthlyDay > MAX_MONTH_DAY)) {
    return 'Monthly day must be between 1 and 31';
  }
  if (endType === 'count' && (!endCount || endCount < 1)) { return 'End count must be at least 1'; }
  if (endType === 'count' && endCount > MAX_END_COUNT) { return `Occurrences cannot exceed ${MAX_END_COUNT}.`; }
  if (endType === 'date' && !endDate) { return 'End date is required'; }
  if (endType === 'date') { return validateRecurrenceEndDate(input); }
  return '';
};

/** The first problem with the form, in the order the fields are checked, or '' when it can be saved. */
export const validateScheduleForm = (input: ScheduleValidationInput): string => {
  const requiredError = validateRequiredFields(input);
  if (requiredError) { return requiredError; }
  if (!input.isPastSession) {
    const timesError = validateTimes(input);
    if (timesError) { return timesError; }
  }
  if (!input.isPastSession && input.isRecurring) {
    const recurrenceError = validateRecurrence(input);
    if (recurrenceError) { return recurrenceError; }
  }
  return input.instructorLeaveError;
};

/** Names the selected instructors who are on approved leave on the start date. */
export const getInstructorLeaveError = (
  instructors: SelectOption[],
  startDate: string,
  approvedLeaves: ApiRecord[],
): string => {
  if (!startDate || instructors.length === 0) { return ''; }
  const conflicts = instructors.filter((instructor) => approvedLeaves.some((leave) => {
    if (leave.submitter_email !== instructor.email) { return false; }
    const leaveStart = leave.leave_start_date as string | undefined;
    const leaveEnd = leave.leave_end_date as string | undefined;
    if (!leaveStart || !leaveEnd) { return false; }
    return startDate >= leaveStart && startDate <= leaveEnd;
  }));
  if (!conflicts.length) { return ''; }
  const names = conflicts.map((i) => i.label || i.email).join(', ');
  return `${names} ${conflicts.length === 1 ? 'is' : 'are'} on approved leave on this date and cannot be assigned to this session.`;
};

/** Soft warning for a weekend or public-holiday start date. Never blocks saving. */
export const getSchedulingWarning = (startDate: string, holidays: CalendarHoliday[]): string => {
  if (!startDate) { return ''; }
  const dayOfWeek = new Date(`${startDate}T00:00:00`).getDay();
  if (dayOfWeek === SUNDAY || dayOfWeek === SATURDAY) {
    return `${dayOfWeek === SUNDAY ? 'Sunday' : 'Saturday'} is a weekend day. You can still schedule this session.`;
  }
  const holidayMatch = holidays.find((h) => h.start_date <= startDate && startDate <= h.end_date);
  if (holidayMatch) {
    return `${holidayMatch.name} is a public holiday on this date. You can still schedule this session.`;
  }
  return '';
};
