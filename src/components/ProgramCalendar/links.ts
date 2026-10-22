// Router paths inside the host app. `basePath` is the app's path to the
// program (fbr-home `/K`, Studio `/programs/K`), with or without a trailing '/'.

const stripTrailingSlash = (basePath: string): string => basePath.replace(/\/$/, '');

/** The attendance roster for one session, scoped to its course when known. */
export const buildRosterPath = (
  basePath: string,
  sessionId: number | string,
  courseId?: string | null,
): string => {
  const path = `${stripTrailingSlash(basePath)}/attendance/sessions/${sessionId}`;
  if (!courseId) { return path; }
  return `${path}?course_id=${encodeURIComponent(courseId)}`;
};

/** The calendar's audit-log view, filtered to one record. */
export const buildAuditPath = (basePath: string, recordId: number | string): string => (
  `${stripTrailingSlash(basePath)}/calendar?view=audit-log&record_id=${recordId}`
);
