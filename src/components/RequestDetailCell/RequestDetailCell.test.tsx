import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils';
import { getSessions } from '../../data/sessions/api';
import RequestDetailCell from './RequestDetailCell';
import { LeaveOrRemoteRequest } from './types';

jest.mock('../../data/sessions/api');

const mockedGetSessions = jest.mocked(getSessions);

const wrap = (req: LeaveOrRemoteRequest, programKey?: string) => renderWithProviders(
  <RequestDetailCell req={req} programKey={programKey} />,
);

beforeEach(() => jest.clearAllMocks());

// ─── remote_session ───────────────────────────────────────────────────────────

describe('remote_session', () => {
  const req = {
    request_type_label: 'remote_session',
    sessions: [
      { id: 's1', title: 'Session A', scheduled_start_time: '2026-06-01T10:00:00' },
    ],
  };

  it('renders a Details toggle button', () => {
    wrap(req);
    expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument();
  });

  it('does not show a mode badge', () => {
    wrap(req);
    expect(screen.queryByText('Full Day')).not.toBeInTheDocument();
    expect(screen.queryByText('Session-specific')).not.toBeInTheDocument();
  });

  it('expands to show session list on click', () => {
    wrap(req);
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText(/Session A/)).toBeInTheDocument();
  });

  it('closes the details modal', () => {
    wrap(req);
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    fireEvent.click(screen.getByText('Close', { selector: 'button' }));
    expect(screen.queryByText(/Session A/)).not.toBeInTheDocument();
  });

  it('shows "No sessions" when sessions array is empty', () => {
    wrap({ request_type_label: 'remote_session', sessions: [] });
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('No sessions')).toBeInTheDocument();
  });
});

// ─── full-day leave ───────────────────────────────────────────────────────────

describe('full-day leave', () => {
  // leave_type: 'full' is the backend-computed field used to distinguish leave types.
  const req = {
    request_type_label: 'leave',
    leave_type: 'full',
    leave_start_date: '2026-06-01',
    leave_end_date: '2026-06-03',
    sessions: [],
  };

  it('shows the Full Day badge', () => {
    wrap(req);
    expect(screen.getByText('Full Day')).toBeInTheDocument();
  });

  it('expands to show "No sessions scheduled in this period" when no sessions', () => {
    wrap(req);
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('No sessions scheduled in this period')).toBeInTheDocument();
  });

  it('shows date range in expanded panel', () => {
    wrap(req);
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText(/Jun 1, 2026/)).toBeInTheDocument();
  });

  it('shows single date when start and end are the same', () => {
    wrap({
      request_type_label: 'leave',
      leave_type: 'full',
      leave_start_date: '2026-06-01',
      leave_end_date: '2026-06-01',
      sessions: [],
    });
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('Jun 1, 2026')).toBeInTheDocument();
  });

  it('lists the program sessions scheduled in the leave period', async () => {
    mockedGetSessions.mockResolvedValue({
      count: 1,
      results: [{ id: 7, title: 'Data Structures', scheduled_start_time: '2026-06-02T10:00:00' }],
    });
    wrap(req, 'prog1');
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('Loading sessions')).toBeInTheDocument();
    expect(await screen.findByText(/Data Structures/)).toBeInTheDocument();
    expect(screen.getByText('Sessions (1)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
    expect(mockedGetSessions).toHaveBeenCalledWith({
      program_key: 'prog1', start_date: '2026-06-01', end_date: '2026-06-03', page: 1,
    });
  });

  // The session list is paginated; later pages used to be dropped silently (#534).
  it('shows the total and loads the remaining sessions on "Show more"', async () => {
    mockedGetSessions
      .mockResolvedValueOnce({
        count: 3,
        results: [
          { id: 1, title: 'PROBE 01', scheduled_start_time: '2026-06-01T08:15:00' },
          { id: 2, title: 'PROBE 02', scheduled_start_time: '2026-06-01T08:30:00' },
        ],
      })
      .mockResolvedValueOnce({
        count: 3,
        results: [{ id: 3, title: 'PROBE 03', scheduled_start_time: '2026-06-01T08:45:00' }],
      });
    wrap(req, 'prog1');
    fireEvent.click(screen.getByRole('button', { name: /details/i }));

    expect(await screen.findByText(/PROBE 02/)).toBeInTheDocument();
    expect(screen.getByText('Sessions (3)')).toBeInTheDocument();
    expect(screen.queryByText(/PROBE 03/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show more (1 remaining)' }));

    expect(await screen.findByText(/PROBE 03/)).toBeInTheDocument();
    expect(screen.getByText(/PROBE 01/)).toBeInTheDocument();
    expect(mockedGetSessions).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  });

  it('shows "No sessions scheduled in this period" when the lookup finds none', async () => {
    mockedGetSessions.mockResolvedValue({ count: 0, results: [] });
    wrap(req, 'prog1');
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(await screen.findByText('No sessions scheduled in this period')).toBeInTheDocument();
  });
});

// ─── session-specific leave ───────────────────────────────────────────────────

describe('session-specific leave', () => {
  const req = {
    request_type_label: 'leave',
    leave_type: 'session_specific',
    leave_start_date: '2026-06-05',
    leave_end_date: '2026-06-05',
    sessions: [
      { id: 's1', title: 'Python Basics', scheduled_start_time: '2026-06-05T10:00:00' },
    ],
  };

  it('shows the Session-specific badge', () => {
    wrap(req);
    expect(screen.getByText('Session-specific')).toBeInTheDocument();
  });

  it('expands to show linked session title', () => {
    wrap(req);
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText(/Python Basics/)).toBeInTheDocument();
  });
});
