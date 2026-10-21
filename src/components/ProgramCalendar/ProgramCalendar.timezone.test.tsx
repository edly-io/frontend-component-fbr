/**
 * @jest-environment ./jest.timezoneEnvironment.js
 * @jest-environment-options {"timezone": "Asia/Karachi"}
 */
import React from 'react';
import { screen, within } from '@testing-library/react';

import { mockHttpClient, renderWithProviders } from '../../testUtils';
import ProgramCalendar from './ProgramCalendar';

jest.mock('@edx/frontend-platform/auth');

// Sessions are bucketed by their start day in the browser's local timezone
// (bucketSessionsByDay → toLocaleDateString). In PKT (+05:00):
// 18:30Z is 23:30 on the 14th, and 19:30Z is 00:30 on the 15th.
const LATE_EVENING = {
  id: 1, title: 'Late Evening', status: 'scheduled', scheduled_start_time: '2026-10-14T18:30:00Z',
};
const AFTER_MIDNIGHT = {
  id: 2, title: 'After Midnight', status: 'scheduled', scheduled_start_time: '2026-10-14T19:30:00Z',
};

const FIXED_NOW = new Date('2026-10-10T09:00:00Z');
const REAL_TIMER_APIS = [
  'hrtime', 'nextTick', 'performance', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame',
  'requestIdleCallback', 'cancelIdleCallback', 'setImmediate', 'clearImmediate', 'setInterval',
  'clearInterval', 'setTimeout', 'clearTimeout',
] as const;

const routeGet = (url: string) => {
  if (url.includes('/calendar-sessions/')) {
    return Promise.resolve({ data: { results: [LATE_EVENING, AFTER_MIDNIGHT], user_role: 'admin' } });
  }
  if (url.includes('/config/')) { return Promise.resolve({ data: { user_role: 'admin', session_types: [] } }); }
  if (url.includes('/program-dates/')) { return Promise.resolve({ data: { courses: [] } }); }
  if (url.includes('/public-holidays/')) { return Promise.resolve({ data: { count: 0, results: [] } }); }
  return Promise.resolve({ data: {} });
};

const dayCell = (label: string) => screen.getByLabelText(new RegExp(`^${label}, `));

beforeEach(() => {
  jest.useFakeTimers({ now: FIXED_NOW, doNotFake: [...REAL_TIMER_APIS] });
  mockHttpClient().get.mockImplementation(routeGet);
});

afterEach(() => {
  jest.useRealTimers();
});

it('runs in Asia/Karachi', () => {
  expect(new Date(LATE_EVENING.scheduled_start_time).getHours()).toBe(23);
});

it('renders a 23:30 PKT session in its own day cell, not the next', async () => {
  renderWithProviders(<ProgramCalendar programKey="K" basePath="/K" />, { route: '/K/calendar' });

  expect(await screen.findByTitle(LATE_EVENING.title)).toBeInTheDocument();
  const oct14 = dayCell('Wednesday, October 14');
  expect(oct14).toHaveAccessibleName('Wednesday, October 14, 1 session');
  expect(within(oct14).getByTitle(LATE_EVENING.title)).toBeInTheDocument();
});

it('renders a 00:30 PKT session on the next local day', async () => {
  renderWithProviders(<ProgramCalendar programKey="K" basePath="/K" />, { route: '/K/calendar' });

  expect(await screen.findByTitle(AFTER_MIDNIGHT.title)).toBeInTheDocument();
  const oct15 = dayCell('Thursday, October 15');
  expect(oct15).toHaveAccessibleName('Thursday, October 15, 1 session');
  expect(within(oct15).getByTitle(AFTER_MIDNIGHT.title)).toBeInTheDocument();
});

it('asks the backend for the visible window in local dates', async () => {
  const http = mockHttpClient();
  http.get.mockImplementation(routeGet);
  renderWithProviders(<ProgramCalendar programKey="K" basePath="/K" />, { route: '/K/calendar' });

  // October 2026's grid runs Sun 27 Sep → Sat 31 Oct, so the window is [27 Sep, 1 Nov).
  await screen.findByTitle(LATE_EVENING.title);
  const calendarUrl = http.get.mock.calls.map(([url]) => url).find((url) => url.includes('/calendar-sessions/'));
  expect(calendarUrl).toContain('start_date=2026-09-27&end_date=2026-11-01');
});
