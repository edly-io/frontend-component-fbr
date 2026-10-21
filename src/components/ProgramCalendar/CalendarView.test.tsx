import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { renderWithProviders } from '../../testUtils';
import CalendarView from './CalendarView';
import { ProgramCalendarProvider } from './ProgramCalendarContext';
import {
  CalendarSession, CalendarViewerRole, CalendarViewMode, CalendarViewProps,
} from './types';

jest.mock('@edx/frontend-platform/auth');

const CURRENT_DATE = new Date(2026, 9, 14); // Wed 14 Oct 2026, local midnight
const SESSION: CalendarSession = {
  id: 9,
  title: 'Design Review',
  status: 'scheduled',
  scheduled_start_time: new Date(2026, 9, 14, 10).toISOString(),
  scheduled_end_time: new Date(2026, 9, 14, 11).toISOString(),
};
const ADMIN: CalendarViewerRole = { canManageSessions: true, isInstructor: false, isLearner: false };
const LEARNER: CalendarViewerRole = { canManageSessions: false, isInstructor: false, isLearner: true };

const renderView = (props: Partial<CalendarViewProps> = {}) => {
  const viewProps: CalendarViewProps = {
    sessions: [SESSION],
    view: 'month',
    currentDate: CURRENT_DATE,
    onViewChange: jest.fn(),
    onNavigate: jest.fn(),
    onGoToToday: jest.fn(),
    onScheduleNew: jest.fn(),
    handlers: {
      onEdit: jest.fn(), onDelete: jest.fn(), onCancel: jest.fn(), onSessionDetail: jest.fn(),
    },
    role: ADMIN,
    ...props,
  };
  renderWithProviders(
    <ProgramCalendarProvider programKey="K" basePath="/K">
      <CalendarView {...viewProps} />
    </ProgramCalendarProvider>,
  );
  return viewProps;
};

it.each<[CalendarViewMode, string, string]>([
  ['month', 'October 2026', 'Sun'],
  ['week', 'Oct 11 – Oct 17, 2026', '12 AM'],
  ['day', 'Wednesday, Oct 14, 2026', '12 AM'],
])('renders the %s view with its range label, grid and sessions', (view, rangeLabel, gridText) => {
  renderView({ view });

  expect(screen.getByText(rangeLabel)).toBeInTheDocument();
  expect(screen.getAllByText(gridText).length).toBeGreaterThan(0);
  expect(screen.getByText(SESSION.title as string)).toBeInTheDocument();
});

it('wires the toolbar to navigation and view changes', () => {
  const props = renderView();

  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  fireEvent.click(screen.getByRole('button', { name: 'Today' }));
  fireEvent.click(screen.getByRole('button', { name: 'Week' }));
  fireEvent.click(screen.getByRole('button', { name: 'New session' }));

  expect(props.onNavigate).toHaveBeenNthCalledWith(1, 1);
  expect(props.onNavigate).toHaveBeenNthCalledWith(2, -1);
  expect(props.onGoToToday).toHaveBeenCalled();
  expect(props.onViewChange).toHaveBeenCalledWith('week');
  expect(props.onScheduleNew).toHaveBeenCalled();
});

it('hides "New session" from learners and greys out a session on approved leave', () => {
  renderView({
    role: LEARNER,
    studentRequestMap: new Map([[9, { state: 'APPROVED', type: 'leave' }]]),
  });

  expect(screen.queryByRole('button', { name: 'New session' })).not.toBeInTheDocument();
  expect(screen.getByTitle('Design Review — On Leave')).toBeInTheDocument();
});
