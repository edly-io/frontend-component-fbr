import { useQuery } from '@tanstack/react-query';
import { fbrKeys, STALE_TIME_MS } from '../queryDefaults';
import {
  ApprovedLeavesParams, getApprovedLeaves, getLeaveUsage, LeaveUsageParams,
} from './api';

export const useApprovedLeaves = (params: ApprovedLeavesParams = {}, enabled = true) => useQuery({
  queryKey: fbrKeys.approvedLeaves(params.program_key),
  queryFn: () => getApprovedLeaves(params),
  staleTime: STALE_TIME_MS,
  enabled,
});

export const useLeaveUsage = (params: LeaveUsageParams, enabled = true) => useQuery({
  queryKey: fbrKeys.leaveUsage(params),
  queryFn: () => getLeaveUsage(params),
  staleTime: STALE_TIME_MS,
  enabled: enabled && Boolean(params.program_key),
});
