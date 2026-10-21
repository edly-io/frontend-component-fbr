import React, { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { bucketSessionsByDay } from '../../utils/dates';
import { CalendarGridContext, CalendarGridContextValue, PopoverId } from './CalendarGridContext';
import { CALENDAR_VIEWS, getWeekDays } from './calendarDates';
import { buildHolidayMap, buildProgramDatesMap } from './calendarMaps';
import CalendarToolbar from './CalendarToolbar';
import MonthGrid from './MonthGrid';
import TimeGrid from './TimeGrid';
import { CalendarViewProps, SessionActionHandlers, SessionHandler } from './types';
import './calendar.scss';

const EMPTY_MAP: Record<string, string> = {};
const NO_HOLIDAYS: NonNullable<CalendarViewProps['holidays']> = [];
const NO_PROGRAM_DATES: NonNullable<CalendarViewProps['programDates']> = [];

/** `open` → `id`; closing clears the state only if `id` is still the open one. */
const nextOpen = <T extends PopoverId>(id: T, open: boolean) => (curr: T | null): T | null => {
  if (open) { return id; }
  return curr === id ? null : curr;
};

/** Which single session/due-date popover and which month-view day popover are open. */
const usePopoverState = () => {
  const [openPopoverId, setOpenPopoverId] = useState<PopoverId | null>(null);
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);

  const setPopoverOpen = useCallback((id: PopoverId, open: boolean) => setOpenPopoverId(nextOpen(id, open)), []);
  const setDayOpen = useCallback((dateKey: string, open: boolean) => {
    if (open) { setOpenPopoverId(null); }
    setOpenDayKey(nextOpen(dateKey, open));
  }, []);
  const closeDayPopover = useCallback(() => setOpenDayKey(null), []);
  const closeAll = useCallback(() => {
    setOpenPopoverId(null);
    setOpenDayKey(null);
  }, []);

  const popovers = useMemo(() => ({
    isPopoverOpen: (id: PopoverId) => openPopoverId === id,
    setPopoverOpen,
    isDayOpen: (dateKey: string) => openDayKey === dateKey,
    setDayOpen,
    closeDayPopover,
  }), [openPopoverId, openDayKey, setPopoverOpen, setDayOpen, closeDayPopover]);

  return { popovers, closeAll };
};

// Every session action closes any open popover first.
const useClosingHandlers = (handlers: SessionActionHandlers, closeAll: () => void): SessionActionHandlers => (
  useMemo(() => {
    const closingFirst = (handler: SessionHandler): SessionHandler => (session) => {
      closeAll();
      handler(session);
    };
    return {
      onEdit: closingFirst(handlers.onEdit),
      onDelete: closingFirst(handlers.onDelete),
      onCancel: closingFirst(handlers.onCancel),
      onSessionDetail: closingFirst(handlers.onSessionDetail),
    };
  }, [handlers, closeAll])
);

/** The month/week/day calendar grid with its toolbar. Data and modals live in ProgramCalendar. */
const CalendarView = ({
  sessions, view, currentDate, onViewChange, onNavigate, onGoToToday, onScheduleNew,
  handlers, role, loading = false, studentRequestMap = null, leaveDateMap = null,
  holidays = NO_HOLIDAYS, programDates = NO_PROGRAM_DATES, sessionTypeColors = EMPTY_MAP,
  sessionTypeLabels = EMPTY_MAP, programName = '',
}: CalendarViewProps) => {
  const { popovers, closeAll } = usePopoverState();
  const gridHandlers = useClosingHandlers(handlers, closeAll);

  const sessionMap = bucketSessionsByDay(sessions);
  const programDatesMap = useMemo(() => buildProgramDatesMap(programDates), [programDates]);
  const holidayMap = useMemo(() => buildHolidayMap(holidays), [holidays]);

  // Toolbar actions close any open popover first, too.
  const closingFirst = <A extends unknown[]>(action: (...args: A) => void) => (...args: A) => {
    closeAll();
    action(...args);
  };

  const gridContext: CalendarGridContextValue = useMemo(() => ({
    role,
    handlers: gridHandlers,
    studentRequestMap,
    leaveDateMap,
    sessionTypeColors,
    sessionTypeLabels,
    ...popovers,
  }), [role, gridHandlers, studentRequestMap, leaveDateMap, sessionTypeColors, sessionTypeLabels, popovers]);

  return (
    <div>
      <CalendarToolbar
        view={view}
        currentDate={currentDate}
        sessions={sessions}
        canManageSessions={role.canManageSessions}
        programName={programName}
        sessionTypeLabels={sessionTypeLabels}
        onNavigate={closingFirst(onNavigate)}
        onGoToToday={closingFirst(onGoToToday)}
        onViewChange={closingFirst(onViewChange)}
        onScheduleNew={closingFirst(onScheduleNew)}
      />

      {/* Active view — subtle opacity during navigation re-fetches */}
      <CalendarGridContext.Provider value={gridContext}>
        <div className={classNames('calendar-view', { 'calendar-view--loading': loading })}>
          {view === CALENDAR_VIEWS.MONTH ? (
            <MonthGrid
              currentDate={currentDate}
              sessionMap={sessionMap}
              holidayMap={holidayMap}
              gradedDatesMap={programDatesMap}
            />
          ) : (
            <TimeGrid
              days={view === CALENDAR_VIEWS.WEEK ? getWeekDays(currentDate) : [currentDate]}
              sessionMap={sessionMap}
              holidayMap={holidayMap}
              programDatesMap={programDatesMap}
            />
          )}
        </div>
      </CalendarGridContext.Provider>
    </div>
  );
};

export default CalendarView;
