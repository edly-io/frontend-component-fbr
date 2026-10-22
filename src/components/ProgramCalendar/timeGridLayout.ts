// Geometry for the week/day time grid. One hour is HOUR_HEIGHT px tall, so a
// block's top offset in px equals its start in minutes after midnight.

import { CalendarSession } from './types';

export const START_HOUR = 0; // midnight — full 24-hour calendar
export const END_HOUR = 24; // 12 AM (next day, exclusive)
export const HOUR_HEIGHT = 60; // px per hour
export const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const MIN_BLOCK_HEIGHT = 22; // so very short sessions remain clickable
const TITLE_LINE_HEIGHT_PX = 14;
const TITLE_PADDING_PX = 4;
const MAX_TITLE_LINES = 3;

export interface SessionLane {
  lane: number;
  totalLanes: number;
}

export const formatHour = (hour: number): string => {
  if (hour === 0) { return '12 AM'; }
  if (hour < 12) { return `${hour} AM`; }
  if (hour === 12) { return '12 PM'; }
  return `${hour - 12} PM`;
};

const toDecimalHours = (date: Date): number => date.getHours() + date.getMinutes() / 60;

const startMs = (session: CalendarSession): number => new Date(session.scheduled_start_time as string).getTime();
const endMs = (session: CalendarSession): number => (
  new Date((session.scheduled_end_time || session.scheduled_start_time) as string).getTime()
);

/** Top offset (px) of a moment inside the time grid. */
export const getTopOffset = (date: Date): number => (
  (Math.max(toDecimalHours(date), START_HOUR) - START_HOUR) * HOUR_HEIGHT
);

/** Top offset and height (px) for a session block inside the time grid. */
export const getSessionPosition = (session: CalendarSession): { top: number; height: number } => {
  const start = new Date(session.scheduled_start_time as string);
  const end = new Date((session.scheduled_end_time || session.scheduled_start_time) as string);
  const startDec = toDecimalHours(start);
  const endDec = toDecimalHours(end);
  const height = Math.max(
    (Math.min(endDec, END_HOUR) - Math.max(startDec, START_HOUR)) * HOUR_HEIGHT,
    MIN_BLOCK_HEIGHT,
  );
  return { top: getTopOffset(start), height };
};

/** How many whole title lines (1–3) fit in a block of this height. */
export const getTitleLineCount = (height: number): number => (
  Math.max(1, Math.min(MAX_TITLE_LINES, Math.floor((height - TITLE_PADDING_PX) / TITLE_LINE_HEIGHT_PX)))
);

/** Greedy lane assignment: each session takes the earliest lane that is free at its start. */
const assignLanes = (sorted: CalendarSession[]): Map<CalendarSession, number> => {
  const laneEndTimes: number[] = [];
  const lanes = new Map<CalendarSession, number>();
  sorted.forEach((session) => {
    let lane = laneEndTimes.findIndex((endTime) => endTime <= startMs(session));
    if (lane === -1) { lane = laneEndTimes.length; }
    laneEndTimes[lane] = endMs(session);
    lanes.set(session, lane);
  });
  return lanes;
};

const overlaps = (a: CalendarSession, b: CalendarSession): boolean => startMs(b) < endMs(a) && endMs(b) > startMs(a);

/**
 * Given the sessions for one day, returns sessionId → { lane, totalLanes } so
 * overlapping sessions render side-by-side. totalLanes reflects only the
 * overlap depth at each session's own time slot, so isolated sessions get the
 * full column width.
 */
export const layoutSessions = (sessions: CalendarSession[]): Record<string, SessionLane> => {
  const sorted = [...sessions].sort((a, b) => startMs(a) - startMs(b));
  const lanes = assignLanes(sorted);
  const result: Record<string, SessionLane> = {};
  sorted.forEach((session) => {
    const concurrent = sorted.filter((other) => overlaps(session, other));
    const maxLane = Math.max(...concurrent.map((s) => lanes.get(s) as number));
    result[String(session.id)] = { lane: lanes.get(session) as number, totalLanes: maxLane + 1 };
  });
  return result;
};
