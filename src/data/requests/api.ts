import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getAttendanceApiUrl } from '../urls';
import { ApiRecord } from '../types';

const APPROVED_STATE = 'APPROVED';
const APPROVED_LEAVES_PAGE_SIZE = '200';

export interface ApprovedLeavesParams {
  program_key?: string;
}

export interface LeaveUsageParams {
  program_key: string;
  q?: string;
  threshold_exceeded?: boolean;
}

/** Approved leave requests visible to the caller (the calendar's leave overlay). */
export const getApprovedLeaves = async ({ program_key }: ApprovedLeavesParams = {}): Promise<ApiRecord[]> => {
  const params = new URLSearchParams({ state: APPROVED_STATE, page_size: APPROVED_LEAVES_PAGE_SIZE });
  if (program_key) { params.set('program_key', program_key); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`requests/leave/?${params.toString()}`));
  return Array.isArray(data) ? data : data.results ?? [];
};

/** Leave usage for a program: admins get every trainee, others get their own row. */
export const getLeaveUsage = async ({ program_key, q, threshold_exceeded }: LeaveUsageParams): Promise<ApiRecord> => {
  const params = new URLSearchParams({ program_key });
  if (q) { params.set('q', q); }
  if (threshold_exceeded) { params.set('threshold_exceeded', ''); }
  const { data } = await getAuthenticatedHttpClient().get(getAttendanceApiUrl(`leave-usage/?${params}`));
  return data;
};
