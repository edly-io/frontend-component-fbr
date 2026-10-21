import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils';
import { getSessionApprovedLeaves } from '../../data/sessions/api';
import SessionLeavesPanel from './SessionLeavesPanel';

jest.mock('../../data/sessions/api');

const mockedGetSessionApprovedLeaves = jest.mocked(getSessionApprovedLeaves);

const MOCK_RESPONSE = {
  count: 2,
  results: [
    {
      session_id: 's1',
      title: 'Session 1',
      scheduled_start_time: '2026-06-15T09:00:00Z',
      status: 'scheduled',
      students_on_leave: [{
        user_id: 1,
        email: 'alice@example.com',
        username: 'alice',
        leave_start_date: '2026-06-15',
        leave_end_date: '2026-06-15',
        leave_request_id: 'l1',
      }],
    },
    {
      session_id: 's2',
      title: 'Session 2',
      scheduled_start_time: '2026-06-20T09:00:00Z',
      status: 'scheduled',
      students_on_leave: [],
    },
  ],
};

const wrap = () => renderWithProviders(<SessionLeavesPanel programKey="prog1" />);

const findButtons = () => screen.getAllByRole<HTMLButtonElement>('button', { name: /view approved leaves/i });

beforeEach(() => jest.clearAllMocks());

describe('SessionLeavesPanel', () => {
  it('renders Sessions & Approved Leaves heading', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Sessions & Approved Leaves')).toBeInTheDocument());
  });

  it('shows session titles in the table', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Session 1')).toBeInTheDocument());
    expect(screen.getByText('Session 2')).toBeInTheDocument();
  });

  it('shows leave count of 1 for session with a student on leave', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Session 1')).toBeInTheDocument());
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('View approved leaves button is disabled for session with 0 leaves', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Session 2')).toBeInTheDocument());
    const disabledBtn = findButtons().find((b) => b.disabled);
    expect(disabledBtn).toBeTruthy();
  });

  it('clicking View approved leaves opens modal with student username', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Session 1')).toBeInTheDocument());
    const enabledBtn = findButtons().find((b) => !b.disabled) as HTMLButtonElement;
    fireEvent.click(enabledBtn);
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
  });

  it('modal shows student email', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Session 1')).toBeInTheDocument());
    const enabledBtn = findButtons().find((b) => !b.disabled) as HTMLButtonElement;
    fireEvent.click(enabledBtn);
    await waitFor(() => expect(screen.getByText('alice@example.com')).toBeInTheDocument());
  });

  it('search input triggers refetch with q param', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Session 1')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/search sessions/i), { target: { value: 'Math' } });
    await waitFor(() => expect(mockedGetSessionApprovedLeaves).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'Math' }),
    ));
  });

  it('shows error alert on API failure', async () => {
    mockedGetSessionApprovedLeaves.mockRejectedValue(new Error('Network error'));
    wrap();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('requests the first page with the panel page size', async () => {
    mockedGetSessionApprovedLeaves.mockResolvedValue(MOCK_RESPONSE);
    wrap();
    await waitFor(() => expect(screen.getByText('Session 1')).toBeInTheDocument());
    expect(mockedGetSessionApprovedLeaves).toHaveBeenCalledWith({
      program_key: 'prog1', page: 1, page_size: 15,
    });
  });
});
