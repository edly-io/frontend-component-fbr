import React, { useEffect, useRef, useState } from 'react';
import { addDays, toDateKey } from './calendarDates';

interface RovingDateOptions {
  /** Every day the grid renders, in order. */
  days: Date[];
  /** The day that takes the tab stop when the remembered one is not on screen. */
  defaultDate: Date;
  /** Shifts the calendar one period back (-1) or forward (1). */
  onNavigate: (direction: number) => void;
  /** Month view: Up/Down move a week, PageUp/PageDown a month and Ctrl+Home/End jump to the month's ends. */
  isMonth: boolean;
}

const fromDateKey = (key: string): Date => new Date(`${key}T00:00:00`);

/** `day` of the month `months` after the one `monthStart` is in, clamped to that month's last day. */
const sameDayInMonth = (monthStart: Date, months: number, day: number): Date => {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth() + months;
  return new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
};

/**
 * Roving tabindex for the calendar grids: the grid is one tab stop and the arrow keys
 * move focus between day cells. Moving past the days on screen shifts the calendar and
 * focus follows to the same date once it renders.
 */
const useRovingDate = ({
  days, defaultDate, onNavigate, isMonth,
}: RovingDateOptions) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [rememberedKey, setRememberedKey] = useState<string | null>(null);
  const shouldFocus = useRef(false);
  const keys = days.map(toDateKey);
  const defaultKey = toDateKey(defaultDate);

  let activeKey = keys[0];
  if (rememberedKey && keys.includes(rememberedKey)) {
    activeKey = rememberedKey;
  } else if (keys.includes(defaultKey)) {
    activeKey = defaultKey;
  }

  useEffect(() => {
    if (shouldFocus.current && rememberedKey && keys.includes(rememberedKey)) {
      shouldFocus.current = false;
      gridRef.current?.querySelector<HTMLElement>(`[role="gridcell"][data-date="${rememberedKey}"]`)?.focus();
    }
  });

  const moveTo = (target: Date, direction = 0) => {
    const key = toDateKey(target);
    setRememberedKey(key);
    shouldFocus.current = true;
    if (direction) {
      onNavigate(direction);
    } else if (!keys.includes(key)) {
      onNavigate(key > keys[keys.length - 1] ? 1 : -1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const cell = event.target as HTMLElement;
    if (cell.getAttribute('role') !== 'gridcell' || !cell.dataset.date) { return; }
    const current = fromDateKey(cell.dataset.date);
    const monthStart = new Date(defaultDate.getFullYear(), defaultDate.getMonth(), 1);
    const weekStart = addDays(current, -current.getDay());

    switch (event.key) {
      case 'ArrowLeft':
        moveTo(addDays(current, -1));
        break;
      case 'ArrowRight':
        moveTo(addDays(current, 1));
        break;
      case 'ArrowUp':
        if (!isMonth) { return; }
        moveTo(addDays(current, -7));
        break;
      case 'ArrowDown':
        if (!isMonth) { return; }
        moveTo(addDays(current, 7));
        break;
      case 'Home':
        if (isMonth && event.ctrlKey) {
          moveTo(monthStart);
        } else {
          moveTo(isMonth ? weekStart : days[0]);
        }
        break;
      case 'End':
        if (isMonth && event.ctrlKey) {
          moveTo(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0));
        } else {
          moveTo(isMonth ? addDays(weekStart, 6) : days[days.length - 1]);
        }
        break;
      case 'PageUp':
        if (!isMonth) { return; }
        moveTo(sameDayInMonth(monthStart, -1, current.getDate()), -1);
        break;
      case 'PageDown':
        if (!isMonth) { return; }
        moveTo(sameDayInMonth(monthStart, 1, current.getDate()), 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return { gridRef, activeKey, handleKeyDown };
};

export default useRovingDate;
