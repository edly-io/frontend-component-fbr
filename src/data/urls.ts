import { getConfig } from '@edx/frontend-platform';

const ATTENDANCE_API_PATH = '/fbr/api/attendance/v1';
const PROGRAMS_API_PATH = '/fbr/api/programs';
const AUDIT_LOGS_API_PATH = '/fbr/api/audit-logs/v1';

export function getAttendanceApiUrl(path: string): string {
  return `${getConfig().LMS_BASE_URL}${ATTENDANCE_API_PATH}/${path}`;
}

export function getProgramsApiUrl(path = ''): string {
  return `${getConfig().STUDIO_BASE_URL}${PROGRAMS_API_PATH}/${path}`;
}

export function getAuditLogsApiUrl(path: string): string {
  return `${getConfig().LMS_BASE_URL}${AUDIT_LOGS_API_PATH}/${path}`;
}
