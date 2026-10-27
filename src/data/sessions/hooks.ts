import {
  keepPreviousData, QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient,
} from '@tanstack/react-query';
import { fbrKeys, FBR_QUERY_OPTIONS } from '../queryDefaults';
import { ApiRecord, PaginatedList } from '../types';
import {
  cancelSession, correctSession, createSession, deleteSession, getCalendarSessions,
  getProgramDates, getSession, getSessionApprovedLeaves, getSessions, updateSession,
} from './api';
import { SessionApprovedLeavesParams, SessionListParams, UpdateSessionVariables } from './types';

/**
 * Refresh everything a session change can affect: calendar windows, session details,
 * session lists (request details), the sessions-with-leaves panel and audit history.
 */
const invalidateSessionData = (queryClient: QueryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: fbrKeys.calendarSessions }),
  queryClient.invalidateQueries({ queryKey: fbrKeys.sessions }),
  queryClient.invalidateQueries({ queryKey: fbrKeys.sessionLists }),
  queryClient.invalidateQueries({ queryKey: fbrKeys.sessionApprovedLeavesLists }),
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
  ...FBR_QUERY_OPTIONS,
  // Keep the previous window on screen (dimmed) while the next one loads.
  placeholderData: keepPreviousData,
  enabled: enabled && Boolean(programKey && startDate && endDate),
});

export const useSession = (sessionId: number | string | null | undefined) => useQuery({
  queryKey: fbrKeys.session(sessionId ?? ''),
  queryFn: () => getSession(sessionId as number | string),
  ...FBR_QUERY_OPTIONS,
  enabled: sessionId !== null && sessionId !== undefined && sessionId !== '',
});

export const useProgramDates = (programKey: string) => useQuery({
  queryKey: fbrKeys.programDates(programKey),
  queryFn: () => getProgramDates(programKey),
  ...FBR_QUERY_OPTIONS,
  enabled: Boolean(programKey),
});

const FIRST_PAGE = 1;

const nextSessionsPage = <T>(lastPage: PaginatedList<T>, pages: PaginatedList<T>[], lastPageParam: number) => {
  const loaded = pages.reduce((sum, page) => sum + page.results.length, 0);
  // An empty page means the total went stale; stop rather than ask forever.
  const hasMore = lastPage.results.length > 0 && loaded < lastPage.count;
  return hasMore ? lastPageParam + 1 : undefined;
};

/** Sessions in a date range, a page at a time: `fetchNextPage` loads the next page. */
export const useSessions = (params: SessionListParams, enabled = true) => useInfiniteQuery({
  queryKey: fbrKeys.sessionList(params),
  queryFn: ({ pageParam }) => getSessions({ ...params, page: pageParam }),
  initialPageParam: FIRST_PAGE,
  getNextPageParam: nextSessionsPage,
  ...FBR_QUERY_OPTIONS,
  enabled,
});

export const useSessionApprovedLeaves = (params: SessionApprovedLeavesParams, enabled = true) => useQuery({
  queryKey: fbrKeys.sessionApprovedLeaves(params),
  queryFn: () => getSessionApprovedLeaves(params),
  ...FBR_QUERY_OPTIONS,
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
