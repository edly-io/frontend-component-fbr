import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockHttpClient } from '../../testUtils';
import { useCalendarSessions, useCreateSession } from './hooks';

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
