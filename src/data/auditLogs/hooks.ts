import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fbrKeys, FBR_QUERY_OPTIONS } from '../queryDefaults';
import { AuditLogParams, getAuditLogs } from './api';

const auditLogQueryOptions = (params: AuditLogParams) => ({
  queryFn: () => getAuditLogs(params),
  enabled: Boolean(params.appLabel),
  placeholderData: keepPreviousData,
  ...FBR_QUERY_OPTIONS,
  gcTime: 0,
});

export const useAuditLogs = (params: AuditLogParams) => useQuery({
  queryKey: fbrKeys.auditLogList(params),
  ...auditLogQueryOptions(params),
});

export const useRecordHistory = (params: AuditLogParams) => useQuery({
  queryKey: fbrKeys.auditLogHistory(params),
  ...auditLogQueryOptions(params),
});
