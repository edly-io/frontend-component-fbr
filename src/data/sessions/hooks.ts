import {
  keepPreviousData, QueryClient, useMutation, useQuery, useQueryClient,
} from '@tanstack/react-query';
import { fbrKeys, STALE_TIME_MS } from '../queryDefaults';
import { ApiRecord } from '../types';
import {
  cancelSession, correctSession, createSession, deleteSession, getCalendarSessions,
  getProgramDates, getSession, getSessionApprovedLeaves, getSessions, updateSession,
} from './api';
import { SessionApprovedLeavesParams, SessionListParams, UpdateSessionVariables } from './types';

/** Refresh everything a session change can affect: calendar windows, session details, audit history. */
const invalidateSessionData = (queryClient: QueryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: fbrKeys.calendarSessions }),
  queryClient.invalidateQueries({ queryKey: fbrKeys.sessions }),
  queryClient.invalidateQueries({ queryKey: fbrKeys.auditLogs }),
]);

export const useCalendarSessions = (
  programKey: string,
  startDate: string,
  endDate: string,
  enabled = true,
) => useQuery({
  queryKey: fbrKeys.calendarSessionsWindow(programKey, startDate, endDate),
  queryFn: () => getCalendarSessions(startDate, endDate, programKey),
  staleTime: STALE_TIME_MS,
  // Keep the previous window on screen (dimmed) while the next one loads.
  placeholderData: keepPreviousData,
  enabled: enabled && Boolean(programKey && startDate && endDate),
});

export const useSession = (sessionId: number | string | null | undefined) => useQuery({
  queryKey: fbrKeys.session(sessionId ?? ''),
  queryFn: () => getSession(sessionId as number | string),
  staleTime: STALE_TIME_MS,
  enabled: sessionId !== null && sessionId !== undefined && sessionId !== '',
});

export const useProgramDates = (programKey: string) => useQuery({
  queryKey: fbrKeys.programDates(programKey),
  queryFn: () => getProgramDates(programKey),
  staleTime: STALE_TIME_MS,
  enabled: Boolean(programKey),
});

export const useSessions = (params: SessionListParams, enabled = true) => useQuery({
  queryKey: fbrKeys.sessionList(params),
  queryFn: () => getSessions(params),
  staleTime: STALE_TIME_MS,
  enabled,
});

export const useSessionApprovedLeaves = (params: SessionApprovedLeavesParams, enabled = true) => useQuery({
  queryKey: fbrKeys.sessionApprovedLeaves(params),
  queryFn: () => getSessionApprovedLeaves(params),
  staleTime: STALE_TIME_MS,
  // Keep the current page on screen while the next page or search loads.
  placeholderData: keepPreviousData,
  enabled,
});

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionData: ApiRecord) => createSession(sessionData),
    onSuccess: () => invalidateSessionData(queryClient),
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, sessionData }: UpdateSessionVariables) => updateSession(sessionId, sessionData),
    onSuccess: () => invalidateSessionData(queryClient),
  });
};

export const useCorrectSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, sessionData }: UpdateSessionVariables) => correctSession(sessionId, sessionData),
    onSuccess: () => invalidateSessionData(queryClient),
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => cancelSession(sessionId),
    onSuccess: () => invalidateSessionData(queryClient),
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => deleteSession(sessionId),
    onSuccess: () => invalidateSessionData(queryClient),
  });
};
