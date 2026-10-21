import { useMemo } from 'react';
import { useConfig } from '../../data/config/hooks';
import { useProgram } from '../../data/programs/hooks';
import { useHolidays } from '../../data/holidays/hooks';
import { useApprovedLeaves } from '../../data/requests/hooks';
import { useCalendarSessions, useProgramDates } from '../../data/sessions/hooks';
import { ProgramDateEvent } from '../../data/sessions/types';
import { toLocalDateStr } from '../../utils/dates';
import { USER_ROLE } from '../../utils/constants';
import {
  buildLeaveDateMap, buildSessionTypeColors, buildSessionTypeLabels, buildStudentRequestMap,
  SessionTypeOption,
} from './calendarMaps';
import {
  ApprovedLeave, CalendarHoliday, CalendarSession, CalendarViewerRole, ProgramInfo,
} from './types';

// page_size=100 covers any realistic set of holidays.
const HOLIDAYS_PARAMS = { pageSize: 100 };
const SESSIONS_LOAD_ERROR = 'Failed to load sessions. Please try again later.';

// Stable empty lists, so memoised maps don't rebuild while data is loading.
const NO_SESSIONS: CalendarSession[] = [];
const NO_HOLIDAYS: CalendarHoliday[] = [];
const NO_PROGRAM_DATES: ProgramDateEvent[] = [];
const NO_LEAVES: ApprovedLeave[] = [];
const NO_SESSION_TYPES: SessionTypeOption[] = [];

/** Global role from `/config/` (learner until it loads); per-session roles come on each session. */
const useViewerRole = () => {
  const { data: config } = useConfig();
  const userRole = config?.user_role ?? USER_ROLE.LEARNER;
  const role: CalendarViewerRole = useMemo(() => ({
    canManageSessions: userRole === USER_ROLE.ADMIN,
    isInstructor: userRole === USER_ROLE.INSTRUCTOR,
    isLearner: userRole === USER_ROLE.LEARNER,
  }), [userRole]);
  const sessionTypes = (config?.session_types as SessionTypeOption[] | undefined) || NO_SESSION_TYPES;
  return { role, sessionTypes };
};

/** Everything the calendar page reads for one program and one visible [start, end) window. */
const useProgramCalendarData = (programKey: string, start: Date, end: Date) => {
  const { role, sessionTypes } = useViewerRole();

  // Stringify the window in local time. toISOString() would convert to UTC
  // first and shift the whole window back a day in +offset timezones (PKT).
  const sessionsQuery = useCalendarSessions(programKey, toLocalDateStr(start), toLocalDateStr(end));
  const holidaysQuery = useHolidays(HOLIDAYS_PARAMS);
  const programDatesQuery = useProgramDates(programKey);
  const programQuery = useProgram(programKey);
  // Leave overlays are for learners and instructors only.
  const leavesQuery = useApprovedLeaves(
    { program_key: programKey },
    (role.isLearner || role.isInstructor) && Boolean(programKey),
  );

  const sessions = (sessionsQuery.data?.sessions as CalendarSession[] | undefined) || NO_SESSIONS;
  const approvedLeaves = (leavesQuery.data as ApprovedLeave[] | undefined) || NO_LEAVES;

  const studentRequestMap = useMemo(
    () => buildStudentRequestMap(approvedLeaves, sessions),
    [approvedLeaves, sessions],
  );
  const leaveDateMap = useMemo(() => buildLeaveDateMap(approvedLeaves), [approvedLeaves]);
  const sessionTypeColors = useMemo(() => buildSessionTypeColors(sessionTypes), [sessionTypes]);
  const sessionTypeLabels = useMemo(() => buildSessionTypeLabels(sessionTypes), [sessionTypes]);

  return {
    role,
    sessions,
    loading: sessionsQuery.isFetching,
    error: sessionsQuery.isError ? SESSIONS_LOAD_ERROR : '',
    holidays: (holidaysQuery.data?.results as CalendarHoliday[] | undefined) || NO_HOLIDAYS,
    programDates: programDatesQuery.data || NO_PROGRAM_DATES,
    programInfo: (programQuery.data as ProgramInfo | undefined) ?? null,
    studentRequestMap,
    leaveDateMap,
    sessionTypeColors,
    sessionTypeLabels,
  };
};

export default useProgramCalendarData;
