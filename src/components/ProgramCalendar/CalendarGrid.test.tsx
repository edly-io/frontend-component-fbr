import React from 'react';
import {
  fireEvent, screen, waitFor, within,
} from '@testing-library/react';

import { renderWithProviders } from '../../testUtils';
import CalendarView from './CalendarView';
import { shiftDate } from './calendarDates';
import { ProgramCalendarProvider } from './ProgramCalendarContext';
import { CalendarSession, CalendarViewerRole, CalendarViewProps } from './types';

jest.mock('@edx/frontend-platform/auth');

const CURRENT_DATE = new Date(2026, 9, 14); // Wed 14 Oct 2026
const SESSION: CalendarSession = {
  id: 9,
  title: 'Design Review',
  status: 'scheduled',
  scheduled_start_time: new Date(2026, 9, 14, 10).toISOString(),
  scheduled_end_time: new Date(2026, 9, 14, 11).toISOString(),
};
const ADMIN: CalendarViewerRole = { canManageSessions: true, isInstructor: false, isLearner: false };

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

const cell = (name: string | RegExp) => screen.getByRole('gridcell', { name });

describe('month grid', () => {
  it('exposes rows, full day-name column headers and one tab stop', () => {
    renderView();

    const grid = screen.getByRole('grid', { name: 'October 2026' });
    expect(within(grid).getAllByRole('columnheader').map((h) => h.getAttribute('aria-label'))).toEqual(
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    );
    // Header row plus the five weeks from Sun 27 Sep to Sat 31 Oct.
    expect(within(grid).getAllByRole('row')).toHaveLength(6);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(35);
    const tabStops = within(grid).getAllByRole('gridcell').filter((c) => c.tabIndex === 0);
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toHaveAccessibleName('Thursday, October 1, 0 sessions');
  });

  it('names a day by everything it shows and keeps chips out of the tab order', () => {
    renderView();

    const oct14 = cell('Wednesday, October 14, 1 session');
    expect(within(oct14).getByTitle('Design Review')).toHaveAttribute('tabindex', '-1');
    expect(oct14).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus with the arrow, Home and End keys', () => {
    renderView();
    const oct1 = cell(/^Thursday, October 1,/);
    oct1.focus();

    fireEvent.keyDown(oct1, { key: 'ArrowRight' });
    expect(cell(/^Friday, October 2,/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
    expect(cell(/^Friday, October 9,/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: 'Home' });
    expect(cell(/^Sunday, October 4,/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
    expect(cell(/^Saturday, October 10,/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: 'End', ctrlKey: true });
    expect(cell(/^Saturday, October 31,/)).toHaveFocus();
    expect(cell(/^Saturday, October 31,/)).toHaveAttribute('tabindex', '0');
  });

  it('shifts the month past the grid edge and on Page Up / Page Down', () => {
    const { onNavigate } = renderView();
    const sep27 = cell(/^Sunday, September 27,/);
    sep27.focus();

    fireEvent.keyDown(sep27, { key: 'ArrowLeft' });
    expect(onNavigate).toHaveBeenLastCalledWith(-1);
    fireEvent.keyDown(cell(/^Thursday, October 1,/), { key: 'PageDown' });
    expect(onNavigate).toHaveBeenLastCalledWith(1);
  });

  it('opens the day popover with Enter and returns focus to the day on Escape', async () => {
    renderView();
    const oct14 = cell('Wednesday, October 14, 1 session');
    oct14.focus();

    fireEvent.keyDown(oct14, { key: 'Enter' });
    const dialog = await screen.findByRole('dialog', { name: 'Wednesday, October 14, 2026' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(cell('Wednesday, October 14, 1 session')).toHaveFocus();
  });
});

describe('week grid', () => {
  it('has one cell per day and only the active day\'s events in the tab order', () => {
    renderView({ view: 'week' });

    const grid = screen.getByRole('grid', { name: 'Oct 11 – Oct 17, 2026' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(7);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(7);
    const event = within(grid).getByRole('button', { name: /^10:00 AM to 11:00 AM, Design Review/ });
    expect(event).toHaveAttribute('tabindex', '-1');

    const oct11 = cell(/^Sunday, October 11,/);
    oct11.focus();
    fireEvent.keyDown(oct11, { key: 'End' });
    expect(cell(/^Saturday, October 17,/)).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: 'Home' });
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight' });
    expect(cell(/^Wednesday, October 14, 1 session/)).toHaveFocus();
    expect(event).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(document.activeElement as Element, { key: 'Enter' });
    expect(event).toHaveFocus();
  });

  it('shifts the week when moving past its first or last day', () => {
    const { onNavigate } = renderView({ view: 'week' });
    const oct17 = cell(/^Saturday, October 17,/);
    oct17.focus();

    fireEvent.keyDown(oct17, { key: 'ArrowRight' });
    expect(onNavigate).toHaveBeenLastCalledWith(1);
  });
});

it('keeps the day of the month when moving by month, clamped to the shorter month', () => {
  expect(shiftDate('month', new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
  expect(shiftDate('month', new Date(2026, 2, 15), -1)).toEqual(new Date(2026, 1, 15));
});
