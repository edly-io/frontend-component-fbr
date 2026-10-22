import { useQuery } from '@tanstack/react-query';
import { fbrKeys, FBR_QUERY_OPTIONS } from '../queryDefaults';
import {
  ApprovedLeavesParams, getApprovedLeaves, getLeaveUsage, LeaveUsageParams,
} from './api';

export const useApprovedLeaves = (params: ApprovedLeavesParams = {}, enabled = true) => useQuery({
  queryKey: fbrKeys.approvedLeaves(params.program_key),
  queryFn: () => getApprovedLeaves(params),
  ...FBR_QUERY_OPTIONS,
  enabled,
});

export const useLeaveUsage = (params: LeaveUsageParams, enabled = true) => useQuery({
  queryKey: fbrKeys.leaveUsage(params),
  queryFn: () => getLeaveUsage(params),
  ...FBR_QUERY_OPTIONS,
  enabled: enabled && Boolean(params.program_key),
});
