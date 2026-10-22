import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockHttpClient } from '../../testUtils';
import {
  useCalendarSessions, useCreateSession, useSession, useSessionApprovedLeaves, useSessions,
} from './hooks';

jest.mock('@edx/frontend-platform/auth');

const PROGRAM_KEY = 'program-v1:FBR+DST+2025-B';
const CALENDAR_URL_PART = '/fbr/api/attendance/v1/calendar-sessions/';

const makeWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const calendarCalls = (get: jest.Mock) => get.mock.calls.filter(([url]) => url.includes(CALENDAR_URL_PART));

describe('useCalendarSessions', () => {
  it('requests the window for one program', async () => {
    const client = mockHttpClient();
    client.get.mockResolvedValue({ data: { results: [], user_role: 'admin' } });

    const { result } = renderHook(
      () => useCalendarSessions(PROGRAM_KEY, '2026-10-01', '2026-10-31'),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url] = client.get.mock.calls[0];
    expect(url).toContain(`${CALENDAR_URL_PART}?start_date=2026-10-01&end_date=2026-10-31&program_key=`);
    expect(url).toContain(encodeURIComponent(PROGRAM_KEY));
    expect(result.current.data).toEqual({ sessions: [], userRole: 'admin' });
  });
});

describe('useCreateSession', () => {
  it('refetches calendar sessions after a session is created', async () => {
    const client = mockHttpClient();
    client.get.mockResolvedValue({ data: { results: [], user_role: 'admin' } });
    client.post.mockResolvedValue({ data: { id: 7 } });
    const wrapper = makeWrapper();

    const calendar = renderHook(
      () => useCalendarSessions(PROGRAM_KEY, '2026-10-01', '2026-10-31'),
      { wrapper },
    );
    await waitFor(() => expect(calendar.result.current.isSuccess).toBe(true));
    expect(calendarCalls(client.get)).toHaveLength(1);

    const create = renderHook(() => useCreateSession(), { wrapper });
    await act(async () => { await create.result.current.mutateAsync({ title: 'New' }); });

    await waitFor(() => expect(calendarCalls(client.get)).toHaveLength(2));
  });
});

// A host QueryClient with TanStack's default retries (3, with backoff), as in Studio and fbr-home.
const makeHostWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

describe('retries', () => {
  it.each([403, 404])('reports a %i straight away instead of retrying', async (status) => {
    const client = mockHttpClient();
    client.get.mockRejectedValue(httpError(status));

    const { result } = renderHook(
      () => useCalendarSessions(PROGRAM_KEY, '2026-10-01', '2026-10-31'),
      { wrapper: makeHostWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('reports a 403 on a session detail straight away', async () => {
    const client = mockHttpClient();
    client.get.mockRejectedValue(httpError(403));

    const { result } = renderHook(() => useSession(5), { wrapper: makeHostWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('still retries a server error', async () => {
    const client = mockHttpClient();
    client.get.mockRejectedValueOnce(httpError(500)).mockResolvedValue({ data: { results: [], user_role: 'admin' } });

    const { result } = renderHook(
      () => useCalendarSessions(PROGRAM_KEY, '2026-10-01', '2026-10-31'),
      { wrapper: makeHostWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
    expect(client.get).toHaveBeenCalledTimes(2);
  });
});

describe('session writes refresh session lists', () => {
  it('refetches the session list and approved-leaves panel after a session is created', async () => {
    const client = mockHttpClient();
    client.get.mockImplementation((url: string) => Promise.resolve({
      data: url.includes('approved-leaves') ? { count: 0, results: [] } : [],
    }));
    client.post.mockResolvedValue({ data: { id: 7 } });
    const wrapper = makeWrapper();
    const listParams = { program_key: PROGRAM_KEY, start_date: '2026-10-01', end_date: '2026-10-31' };
    const callsTo = (part: string) => client.get.mock.calls.filter(([url]) => url.includes(part)).length;

    const list = renderHook(() => useSessions(listParams), { wrapper });
    const leaves = renderHook(() => useSessionApprovedLeaves({ program_key: PROGRAM_KEY }), { wrapper });
    await waitFor(() => expect(list.result.current.isSuccess && leaves.result.current.isSuccess).toBe(true));
    const sessionListCalls = callsTo('/sessions/?');
    const approvedLeavesCalls = callsTo('/sessions/approved-leaves/');

    const create = renderHook(() => useCreateSession(), { wrapper });
    await act(async () => { await create.result.current.mutateAsync({ title: 'New' }); });

    await waitFor(() => expect(callsTo('/sessions/?')).toBe(sessionListCalls + 1));
    expect(callsTo('/sessions/approved-leaves/')).toBe(approvedLeavesCalls + 1);
  });
});
