import { useCallback, useMemo, useState } from 'react';
import {
  CALENDAR_VIEWS, computeFetchWindow, getToday, shiftDate,
} from './calendarDates';
import { CalendarViewMode } from './types';

/** The calendar's view and date, and the [start, end) window they show (which drives the fetch). */
const useCalendarNavigation = () => {
  const [view, setView] = useState<CalendarViewMode>(CALENDAR_VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(getToday);

  const { start, end } = useMemo(() => computeFetchWindow(view, currentDate), [view, currentDate]);

  const handleNavigate = useCallback((direction: number) => {
    setCurrentDate((prev) => shiftDate(view, prev, direction));
  }, [view]);

  const handleGoToToday = useCallback(() => setCurrentDate(getToday()), []);

  return {
    view,
    currentDate,
    start,
    end,
    handleNavigate,
    handleGoToToday,
    handleViewChange: setView,
  };
};

export default useCalendarNavigation;
