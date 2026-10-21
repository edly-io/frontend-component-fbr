import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fbrKeys, STALE_TIME_MS } from '../queryDefaults';
import { AuditLogParams, getAuditLogs } from './api';

const MAX_RETRIES = 3;
const NO_RETRY_STATUSES = [403, 404];

interface HttpError {
  response?: { status?: number };
}

const retryExceptClientErrors = (failureCount: number, error: HttpError): boolean => {
  if (NO_RETRY_STATUSES.includes(error?.response?.status ?? 0)) {
    return false;
  }
  return failureCount < MAX_RETRIES;
};

const auditLogQueryOptions = (params: AuditLogParams) => ({
  queryFn: () => getAuditLogs(params),
  enabled: Boolean(params.appLabel),
  placeholderData: keepPreviousData,
  retry: retryExceptClientErrors,
  staleTime: STALE_TIME_MS,
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
