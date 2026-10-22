import React from 'react';
import {
  fireEvent, screen, waitFor, within,
} from '@testing-library/react';
import { useSearchParams } from 'react-router-dom';

import { mockHttpClient, renderWithProviders } from '../../testUtils';
import { useCreateSession } from '../../data/sessions/hooks';
import ProgramCalendar from './ProgramCalendar';

jest.mock('@edx/frontend-platform/auth');

// The audit-log view is not under test here.
jest.mock('../AuditLogTable', () => ({
  AuditLogTable: () => <div data-testid="audit-log" />,
}));

// Only Date is faked: the calendar opens on a fixed month, while timers,
// promises and react-query keep running for real.
const FIXED_NOW = new Date('2026-10-14T09:00:00Z');
const REAL_TIMER_APIS = [
  'hrtime', 'nextTick', 'performance', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame',
  'requestIdleCallback', 'cancelIdleCallback', 'setImmediate', 'clearImmediate', 'setInterval',
  'clearInterval', 'setTimeout', 'clearTimeout',
] as const;

const PROGRAM_KEY = 'program-v1:FBR+STP+2026-A';
const SESSION_ID = '674f916a-e401-439e-b4ab-7e6bd487c97b';
const session = { id: SESSION_ID, title: 'Morning Lecture' };
const SESSIONS_LOAD_ERROR = 'Failed to load sessions. Please try again later.';

// A future session inside the fixed month, with a course for the roster link.
const FUTURE_SESSION = {
  id: 5,
  title: 'Python Workshop',
  status: 'scheduled',
  course_id: 'course-v1:X',
  course_name: 'Intro to Python',
  scheduled_start_time: '2026-10-20T10:00:00Z',
  scheduled_end_time: '2026-10-20T11:00:00Z',
};

interface HttpState {
  calendarSessions: object[];
  calendarError: unknown;
  getSession: jest.Mock;
}

let http: ReturnType<typeof mockHttpClient>;
let state: HttpState;

const calendarResponse = () => {
  if (state.calendarError) { return Promise.reject(state.calendarError); }
  return Promise.resolve({ data: { results: state.calendarSessions, user_role: 'admin' } });
};

// One GET handler for every endpoint the calendar page reads.
const routeGet = (url: string) => {
  if (url.includes('/calendar-sessions/')) { return calendarResponse(); }
  if (url.includes('/config/')) { return Promise.resolve({ data: { user_role: 'admin', session_types: [] } }); }
  if (url.includes('/program-dates/')) { return Promise.resolve({ data: { courses: [] } }); }
  if (url.includes('/public-holidays/')) { return Promise.resolve({ data: { count: 0, results: [] } }); }
  if (url.includes('/requests/leave/')) { return Promise.resolve({ data: [] }); }
  if (url.includes('/sessions/')) { return state.getSession(url); }
  return Promise.resolve({ data: {} });
};

const calendarGetCount = () => http.get.mock.calls.filter(([url]) => url.includes('/calendar-sessions/')).length;

// A tiny visible readout of the current search params so tests can assert that
// calendar navigation did NOT strip ?modal=&id= (the bug being fixed).
const SearchParamsProbe = () => {
  const [searchParams] = useSearchParams();
  return (
    <div data-testid="search-params">
      modal={searchParams.get('modal')};id={searchParams.get('id')}
    </div>
  );
};

const renderCalendar = (search = `?modal=session&id=${SESSION_ID}`, basePath = `/${PROGRAM_KEY}`) => renderWithProviders(
  <><ProgramCalendar programKey={PROGRAM_KEY} basePath={basePath} /><SearchParamsProbe /></>,
  { route: `/${PROGRAM_KEY}/calendar${search}` },
);

beforeEach(() => {
  jest.useFakeTimers({ now: FIXED_NOW, doNotFake: [...REAL_TIMER_APIS] });
  http = mockHttpClient();
  state = { calendarSessions: [], calendarError: null, getSession: jest.fn() };
  http.get.mockImplementation(routeGet);
});

afterEach(() => {
  jest.useRealTimers();
});

it('keeps modal/id params in the URL and surfaces an error when the direct session fetch fails', async () => {
  state.getSession.mockRejectedValue(new Error('boom'));

  renderCalendar();

  // The detail error is shown (not silently swallowed)…
  expect(await screen.findByText('Failed to load session details.')).toBeInTheDocument();

  // …and, crucially, closeModal() was NOT called: the URL still carries
  // ?modal=session&id=<id> so a later session load can still open the modal.
  expect(screen.getByTestId('search-params')).toHaveTextContent(`modal=session;id=${SESSION_ID}`);
});

it('opens the session detail modal from the URL on a successful direct fetch', async () => {
  state.getSession.mockResolvedValue({ data: session });

  renderCalendar();

  expect(await screen.findByText('Morning Lecture')).toBeInTheDocument();
  expect(screen.getByTestId('search-params')).toHaveTextContent(`modal=session;id=${SESSION_ID}`);
});

it('still opens the modal on retry after a transient fetch failure (URL params survive)', async () => {
  // A transient in-app failure must not tear down ?modal=&id= — because it does,
  // the same URL can recover (e.g. re-navigation / refresh) and open the modal.
  state.getSession.mockRejectedValue(new Error('boom'));

  const first = renderCalendar();
  expect(await screen.findByText('Failed to load session details.')).toBeInTheDocument();
  expect(first.getByTestId('search-params')).toHaveTextContent(`modal=session;id=${SESSION_ID}`);

  // Now the backend recovers; re-rendering the SAME URL must open the modal,
  // which would be impossible if the previous failure had stripped the params.
  state.getSession.mockResolvedValue({ data: session });
  renderCalendar();

  expect(await screen.findByText('Morning Lecture')).toBeInTheDocument();
  // Both the failed first render and the recovered second render kept ?modal=&id=.
  screen.getAllByTestId('search-params').forEach(
    (el) => expect(el).toHaveTextContent(`modal=session;id=${SESSION_ID}`),
  );
});

// ─── Stale view after a write ────────────────────────────────────────────────

const CreateSessionTrigger = () => {
  const createSession = useCreateSession();
  return (
    <button type="button" onClick={() => createSession.mutate({ title: FUTURE_SESSION.title })}>
      Create session
    </button>
  );
};

it('shows a session an admin creates without remounting the calendar', async () => {
  http.post.mockImplementation(() => {
    state.calendarSessions = [FUTURE_SESSION];
    return Promise.resolve({ data: FUTURE_SESSION });
  });
  renderWithProviders(
    <><ProgramCalendar programKey={PROGRAM_KEY} basePath={`/${PROGRAM_KEY}`} /><CreateSessionTrigger /></>,
    { route: `/${PROGRAM_KEY}/calendar` },
  );
  expect(await screen.findByText('October 2026')).toBeInTheDocument();
  expect(screen.queryByText(FUTURE_SESSION.title)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Create session' }));

  expect(await screen.findByText(FUTURE_SESSION.title)).toBeInTheDocument();
  expect(http.post).toHaveBeenCalledWith(expect.stringContaining('/sessions/'), { title: FUTURE_SESSION.title });
  expect(calendarGetCount()).toBe(2);
});

it('removes a session an admin deletes from the calendar without a reload', async () => {
  state.calendarSessions = [FUTURE_SESSION];
  http.delete.mockImplementation(() => {
    state.calendarSessions = [];
    return Promise.resolve({ data: null });
  });
  renderCalendar('');

  fireEvent.click(await screen.findByTitle(FUTURE_SESSION.title));
  fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
  const dialog = await screen.findByRole('dialog', { name: 'Delete Session' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

  expect(await screen.findByText('Session deleted successfully!')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByTitle(FUTURE_SESSION.title)).not.toBeInTheDocument());
  expect(http.delete).toHaveBeenCalledWith(expect.stringContaining(`/sessions/${FUTURE_SESSION.id}/`));
});

it.each([
  ['Delete', 'Delete Session', 'Delete', 'Deleting…', 'Cancel', 'delete'],
  ['Cancel', 'Cancel Session', 'Cancel session', 'Cancelling…', 'Keep scheduled', 'post'],
] as const)('locks the %s confirmation until the calendar has refreshed', async (action, title, confirm, pending, dismiss, method) => {
  state.calendarSessions = [FUTURE_SESSION];
  let finishRequest: (value: unknown) => void = () => {};
  http[method].mockImplementation(() => new Promise((resolve) => { finishRequest = resolve; }));
  renderCalendar('');

  fireEvent.click(await screen.findByTitle(FUTURE_SESSION.title));
  fireEvent.click(await screen.findByRole('button', { name: action }));
  const dialog = await screen.findByRole('dialog', { name: title });
  fireEvent.click(within(dialog).getByRole('button', { name: confirm }));

  expect(await within(dialog).findByRole('button', { name: pending })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: dismiss })).toBeDisabled();
  expect(within(dialog).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
  finishRequest({ data: {} });
  await waitFor(() => expect(screen.queryByRole('dialog', { name: title })).not.toBeInTheDocument());
});

// ─── Backend 403 ─────────────────────────────────────────────────────────────

it('shows an error Alert, not a spinner, when calendar-sessions returns 403', async () => {
  state.calendarError = Object.assign(new Error('Forbidden'), { response: { status: 403 } });

  renderCalendar('');

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(SESSIONS_LOAD_ERROR);
  expect(screen.queryByText('Loading your sessions...')).not.toBeInTheDocument();
});

// ─── basePath with or without a trailing slash ───────────────────────────────

const openRosterLink = async () => {
  fireEvent.click(await screen.findByTitle(FUTURE_SESSION.title));
  return screen.findByRole('link', { name: 'Attendance' });
};

it.each(['/programs/K', '/programs/K/'])('builds the same roster link from basePath %s', async (basePath) => {
  state.calendarSessions = [FUTURE_SESSION];

  renderCalendar('', basePath);

  expect(await openRosterLink()).toHaveAttribute(
    'href',
    '/programs/K/attendance/sessions/5?course_id=course-v1%3AX',
  );
  expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
    'href',
    '/programs/K/calendar?view=audit-log&record_id=5',
  );
});

// ─── Admins never see trainees' leaves as their own ─────────────────────────

it('does not grey out an admin\'s sessions when leaves load before /config/ resolves', async () => {
  // Studio: config is not cached yet, so the role reads as learner on first render
  // and the leaves query fires. Admins get every trainee's leave from that endpoint.
  state.calendarSessions = [FUTURE_SESSION];
  let resolveConfig: (value: unknown) => void = () => {};
  const configResponse = new Promise((resolve) => { resolveConfig = resolve; });
  http.get.mockImplementation((url: string) => {
    if (url.includes('/config/')) { return configResponse; }
    if (url.includes('/requests/leave/')) {
      return Promise.resolve({
        data: [{
          state: 'APPROVED', leave_type: 'full_day', leave_start_date: '2026-10-20', leave_end_date: '2026-10-20',
        }],
      });
    }
    return routeGet(url);
  });

  const { container } = renderCalendar('');
  await waitFor(() => expect(calendarGetCount()).toBeGreaterThan(0));
  resolveConfig({ data: { user_role: 'admin', session_types: [] } });

  expect(await screen.findByRole('button', { name: /Python Workshop/ })).toBeInTheDocument();
  expect(container.querySelector('.calendar-chip--onleave')).toBeNull();
  // The overlay waits for the real role, so an admin never requests leaves at all.
  expect(http.get.mock.calls.some(([url]) => url.includes('/requests/leave/'))).toBe(false);
});
