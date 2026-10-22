import * as library from './index';

const PUBLIC_NAMES = [
  // Pre-existing
  'UserIdentity', 'CertificateHtmlView', 'PrintCertificateButton', 'printCertificate', 'buildCertificateFileName',
  'DebouncedSearch',
  // Components
  'ProgramCalendar', 'ProgramCalendarProvider', 'useProgramCalendar', 'buildRosterPath', 'buildAuditPath',
  'CalendarPdfDownloadButton', 'AuditLogTable', 'DatepickerControl', 'DATEPICKER_TYPES', 'SearchableSelect',
  'MobileRowCardsList', 'MobileRowCard', 'MobileRowField', 'SectionHeading', 'RequestStatusBadge', 'ScopeBadge',
  'InstructingBadge', 'RequestDetailCell', 'RequestSummary', 'SessionLeavesPanel',
  // Hooks
  'useModalParams', 'useIsBelowLg', 'useConfig', 'useCalendarSessions', 'useSession', 'useProgramDates',
  'useSessions', 'useSessionApprovedLeaves', 'useCreateSession', 'useUpdateSession', 'useCorrectSession',
  'useCancelSession', 'useDeleteSession', 'useProgram', 'useProgramCourses', 'useProgramInstructors',
  'useHolidays', 'useLocations', 'useApprovedLeaves', 'useLeaveUsage', 'useAuditLogs', 'useRecordHistory',
  // Plain API functions (fbr-home's JS code still calls these directly)
  'getSession', 'createSession', 'updateSession', 'correctSession', 'cancelSession', 'deleteSession',
  'getSessionStartLink', 'getProgramDates', 'getCalendarSessions', 'getSessions', 'getSessionApprovedLeaves',
  'getSessionsConfig', 'getProgram', 'fetchProgramCourses', 'fetchProgramInstructors', 'getHolidays',
  'getLocations', 'getApprovedLeaves', 'getLeaveUsage', 'getAuditLogs',
  // Data helpers
  'fbrKeys', 'STALE_TIME_MS', 'CONFIG_STALE_TIME_MS', 'getAttendanceApiUrl', 'getProgramsApiUrl',
  'getAuditLogsApiUrl',
  // Utils and constants
  'formatDateTime', 'toLocalDateStr', 'bucketSessionsByDay', 'formatLeaveRange', 'extractApiError',
  'formatDuration', 'getStatusVariant', 'formatInstructorNames', 'getSessionTypeLabel', 'toRoleBadges',
  'USER_ROLE', 'REQUEST_STATUS', 'REQUEST_TYPE', 'SESSION_STATUS', 'FBR_ROLE', 'FBR_ADMIN_ROLES',
];

describe('public API', () => {
  it.each(PUBLIC_NAMES)('exports %s', (name) => {
    expect((library as Record<string, unknown>)[name]).toBeDefined();
  });
});
