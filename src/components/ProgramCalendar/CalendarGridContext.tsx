import { createContext, useContext } from 'react';
import {
  CalendarViewerRole, LeaveDateMap, SessionActionHandlers, StudentRequestMap,
} from './types';

export type PopoverId = string | number;

/**
 * What every cell, chip and popover in one CalendarView reads: the viewer's
 * role, the session actions, the leave overlays, the type styling, and which
 * single popover is open.
 */
export interface CalendarGridContextValue {
  role: CalendarViewerRole;
  /** Each handler closes any open popover before it runs. */
  handlers: SessionActionHandlers;
  studentRequestMap: StudentRequestMap | null;
  leaveDateMap: LeaveDateMap | null;
  sessionTypeColors: Record<string, string>;
  sessionTypeLabels: Record<string, string>;
  isPopoverOpen: (id: PopoverId) => boolean;
  /** Opens `id` (replacing any other open popover), or closes it if it is the open one. */
  setPopoverOpen: (id: PopoverId, open: boolean) => void;
  /** Month view: the day popover, keyed by local date (YYYY-MM-DD). */
  isDayOpen: (dateKey: string) => boolean;
  /** Opening a day closes any open session popover. */
  setDayOpen: (dateKey: string, open: boolean) => void;
  closeDayPopover: () => void;
}

export const CalendarGridContext = createContext<CalendarGridContextValue | null>(null);

export const useCalendarGrid = (): CalendarGridContextValue => {
  const value = useContext(CalendarGridContext);
  if (!value) {
    throw new Error('useCalendarGrid must be used inside a CalendarView');
  }
  return value;
};

/** Popover id for a graded due date, kept apart from session ids. */
export const gradedPopoverId = (eventId: string): string => `gd::${eventId}`;
