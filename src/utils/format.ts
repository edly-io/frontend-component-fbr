const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred';
const DEFAULT_STATUS_VARIANT = 'secondary';

const STATUS_VARIANTS: Record<string, string> = {
  present: 'success',
  absent: 'danger',
  leave: 'warning',
  pending: 'secondary',
  scheduled: 'secondary',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

export interface ApiErrorLike {
  message?: string;
  response?: { data?: unknown };
}

export interface SessionWithInstructors {
  instructor_names?: string[] | null;
  instructor_name?: string | null;
  session_type?: string | null;
}

export const formatDuration = (seconds?: number | null): string => {
  if (!seconds || seconds === 0) { return '0m'; }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const getStatusVariant = (status: string): string => STATUS_VARIANTS[status] || DEFAULT_STATUS_VARIANT;

const flattenFieldErrors = (data: Record<string, unknown>): string[] => (
  Object.entries(data).flatMap(([field, val]) => {
    const msgs = Array.isArray(val) ? val : [val];
    return field === 'non_field_errors'
      ? msgs.map(String)
      : msgs.map((m) => `${field}: ${m}`);
  })
);

/**
 * Extract a user-friendly error message from an Axios error.
 * Centralises the error extraction pattern used across all catch blocks.
 */
export const extractApiError = (err: ApiErrorLike, fallback = DEFAULT_ERROR_MESSAGE): string => {
  const data = err.response?.data;
  if (!data) { return err.message || fallback; }
  if (typeof data === 'string') { return data; }
  if (typeof data !== 'object') { return err.message || fallback; }
  const record = data as Record<string, unknown>;
  if (record.detail) { return String(record.detail); }
  if (record.error) { return String(record.error); }
  // DRF field-level validation errors: { field: ["msg", ...], non_field_errors: [...] }
  const messages = flattenFieldErrors(record);
  if (messages.length) { return messages.join(' | '); }
  return err.message || fallback;
};

export const formatInstructorNames = (session?: SessionWithInstructors | null): string => {
  const names = session?.instructor_names;
  if (Array.isArray(names) && names.length) { return names.join(', '); }
  return session?.instructor_name || '';
};

export const getSessionTypeLabel = (
  session?: SessionWithInstructors | null,
  sessionTypeLabels: Record<string, string> = {},
): string => {
  const rawType = session?.session_type;
  if (!rawType) { return ''; }
  if (sessionTypeLabels[rawType]) { return sessionTypeLabels[rawType]; }
  return rawType
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};
