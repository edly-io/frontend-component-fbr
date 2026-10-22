// Every query sets staleTime explicitly: host apps configure their own
// QueryClient defaults (Studio uses 1 hour), which is far too long for
// sessions, requests and attendance.
export const STALE_TIME_MS = 30_000;
export const CONFIG_STALE_TIME_MS = 5 * 60_000;

const MAX_RETRIES = 3;
// The backend's answer to these won't change on retry (another city's program,
// a deleted record), so report them at once instead of after the host's backoff.
const NO_RETRY_STATUSES = [403, 404];

interface HttpError {
  response?: { status?: number };
}

// Typed as `Error` (TanStack's default error type) so queries keep their usual
// error type; axios errors carry the HTTP status on `response`.
export const retryExceptClientErrors = (failureCount: number, error: Error): boolean => {
  const status = (error as Error & HttpError)?.response?.status ?? 0;
  if (NO_RETRY_STATUSES.includes(status)) {
    return false;
  }
  return failureCount < MAX_RETRIES;
};

/** Options every library query shares, so host QueryClient defaults don't change library behaviour. */
export const FBR_QUERY_OPTIONS = {
  staleTime: STALE_TIME_MS,
  retry: retryExceptClientErrors,
};

// All library query keys start with 'fbr', so a host app can invalidate or
// inspect library data without colliding with its own keys. Each domain's
// root key (e.g. fbrKeys.sessions) invalidates every query in that domain.
export const fbrKeys = {
  all: ['fbr'] as const,
  config: ['fbr', 'config'] as const,
  calendarSessions: ['fbr', 'calendarSessions'] as const,
  calendarSessionsWindow: (programKey: string, startDate: string, endDate: string) => (
    ['fbr', 'calendarSessions', programKey, startDate, endDate] as const
  ),
  session: (sessionId: number | string) => ['fbr', 'session', String(sessionId)] as const,
  sessions: ['fbr', 'session'] as const,
  sessionLists: ['fbr', 'sessionList'] as const,
  sessionList: (params: object) => ['fbr', 'sessionList', params] as const,
  sessionApprovedLeavesLists: ['fbr', 'sessionApprovedLeaves'] as const,
  sessionApprovedLeaves: (params: object) => ['fbr', 'sessionApprovedLeaves', params] as const,
  programDates: (programKey: string) => ['fbr', 'programDates', programKey] as const,
  program: (programKey: string) => ['fbr', 'program', programKey] as const,
  programCourses: (programKey: string) => ['fbr', 'programCourses', programKey] as const,
  programInstructors: (programKey: string, courseId?: string | null) => (
    ['fbr', 'programInstructors', programKey, courseId ?? null] as const
  ),
  holidays: ['fbr', 'holidays'] as const,
  holidayList: (params: object) => ['fbr', 'holidays', params] as const,
  locations: ['fbr', 'locations'] as const,
  locationList: (params: object) => ['fbr', 'locations', params] as const,
  approvedLeaves: (programKey?: string) => ['fbr', 'approvedLeaves', programKey ?? null] as const,
  leaveUsage: (params: object) => ['fbr', 'leaveUsage', params] as const,
  auditLogs: ['fbr', 'auditLogs'] as const,
  auditLogList: (params: object) => ['fbr', 'auditLogs', 'list', params] as const,
  auditLogHistory: (params: object) => ['fbr', 'auditLogs', 'history', params] as const,
};
