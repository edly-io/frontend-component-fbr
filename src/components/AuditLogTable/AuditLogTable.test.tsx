import React from 'react';
import {
  fireEvent, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockHttpClient, renderWithProviders } from '../../testUtils';
import { getAuditLogs } from '../../data/auditLogs/api';
import AuditLogTable from './AuditLogTable';
import { AuditLogTableProps } from './types';

jest.mock('@edx/frontend-platform/auth');
jest.mock('../../data/auditLogs/api');

const mockedGetAuditLogs = jest.mocked(getAuditLogs);

const programProps: AuditLogTableProps = {
  appLabel: 'fbr_programs',
  models: ['programcourse'],
};

const renderTable = (props: Partial<AuditLogTableProps> = {}) => renderWithProviders(
  <AuditLogTable {...programProps} {...props} />,
);

const renderSessionsTable = (props: Partial<AuditLogTableProps> = {}) => renderWithProviders(
  <AuditLogTable appLabel="attendance" {...props} />,
);

const EMPTY_PAGE = { results: [], count: 0 };

const buildEntry = (overrides = {}) => ({
  id: 1,
  timestamp: '2026-09-01T10:00:00Z',
  actor_name: 'admin',
  actor_email: 'admin@test.com',
  actor_role: undefined,
  action: 'updated',
  record_type: 'programcourse',
  object_repr: 'Some Record',
  changes: {},
  object_pk: '1',
  ...overrides,
});

const waitForEmptyState = () => waitFor(() => {
  expect(screen.getByText(/No activity recorded yet\./i)).toBeInTheDocument();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('<AuditLogTable /> (program models)', () => {
  it('renders empty state when no logs returned', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_PAGE);
    renderTable();
    await waitForEmptyState();
  });

  it('renders log entries', async () => {
    mockedGetAuditLogs.mockResolvedValue({
      results: [buildEntry({
        action: 'created', object_repr: 'Test Enrollment', actor_email: 'admin@test.com',
      })],
      count: 1,
    });
    renderTable();
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  it('action filter changes the displayed option', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_PAGE);
    renderTable();
    await waitForEmptyState();
    const select = screen.getByRole<HTMLSelectElement>('combobox');
    fireEvent.change(select, { target: { value: '0' } });
    expect(select.value).toBe('0');
  });

  it('search input filters results', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_PAGE);
    renderTable();
    await waitForEmptyState();
    jest.useFakeTimers();
    const searchInput = screen.getByPlaceholderText(/Search by record name/i);
    fireEvent.change(searchInput, { target: { value: 'alice' } });
    jest.runAllTimers();
    await waitFor(() => {
      expect(mockedGetAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'alice' }),
      );
    });
    jest.useRealTimers();
  });

  it('date range from input updates state', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_PAGE);
    renderTable();
    await waitForEmptyState();
    const fromInput = screen.getByLabelText<HTMLInputElement>('From');
    fireEvent.change(fromInput, { target: { value: '2026-09-01' } });
    expect(fromInput.value).toBe('2026-09-01');
    // The shared picker parses typed text in its display format (DD/MM/YYYY) only.
    fireEvent.change(fromInput, { target: { value: '01/09/2026' } });
    await waitFor(() => {
      expect(mockedGetAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ dateFrom: '2026-09-01' }),
      );
    });
  });

  it('date range to input has min set to from value', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_PAGE);
    renderTable();
    await waitForEmptyState();
    // A far-future From date makes the To calendar open on that month, whatever today is.
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '15/09/2099' } });
    fireEvent.focus(screen.getByLabelText('To'));
    expect(await screen.findByLabelText('Not available Monday, September 14th, 2099'))
      .toHaveClass('react-datepicker__day--disabled');
    expect(screen.getByLabelText('Choose Tuesday, September 15th, 2099'))
      .not.toHaveClass('react-datepicker__day--disabled');
  });

  it('renders actor name from log entry', async () => {
    mockedGetAuditLogs.mockResolvedValue({
      results: [buildEntry({
        id: 42, actor_name: 'user1', actor_email: 'user1@test.com', object_pk: '42',
      })],
      count: 1,
    });
    renderTable();
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });

  it('labels an enrollment withdrawal as "Withdrawn"', async () => {
    mockedGetAuditLogs.mockResolvedValue({
      results: [buildEntry({
        record_type: 'enrollment',
        object_repr: 'Ali in Program 1',
        changes: { status: ['active', 'withdrawn'] },
      })],
      count: 1,
    });
    renderTable({ models: ['enrollment'] });
    expect(await screen.findByText('Withdrawn')).toBeInTheDocument();
  });

  it('sends course_key when courseKey is set', async () => {
    const { getAuditLogs: realGetAuditLogs } = jest.requireActual('../../data/auditLogs/api');
    mockedGetAuditLogs.mockImplementation(realGetAuditLogs);
    const httpClient = mockHttpClient();
    httpClient.get.mockResolvedValue({ data: EMPTY_PAGE });
    renderTable({ courseKey: 'C' });
    await waitForEmptyState();
    const [calledUrl] = httpClient.get.mock.calls[0];
    expect(calledUrl).toContain('course_key=C');
  });
});

describe('<AuditLogTable /> (session models)', () => {
  it('renders empty state when no logs returned (attendance app)', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_PAGE);
    renderSessionsTable();
    await waitFor(() => expect(
      screen.getByText(/no activity recorded yet/i),
    ).toBeInTheDocument());
  });

  it('renders a log entry actor name', async () => {
    mockedGetAuditLogs.mockResolvedValue({
      results: [buildEntry({
        action: 'created', record_type: 'session', object_repr: 'Session 1', actor_email: 'admin@fbr.gov',
      })],
      count: 1,
    });
    renderSessionsTable();
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument());
  });

  it('action filter dropdown is rendered', async () => {
    mockedGetAuditLogs.mockResolvedValue(EMPTY_PAGE);
    renderSessionsTable();
    // The select is rendered immediately (before the async load resolves).
    const select = document.querySelector('select');
    expect(select).not.toBeNull();
    await waitForEmptyState();
  });

  const entryWithChanges = buildEntry({
    id: 7,
    actor_name: 'Farah Naz',
    actor_email: 'farah@fbr.gov',
    actor_role: 'super_admin',
    record_type: 'session',
    object_repr: 'Session 42',
    changes: { title: ['Old title', 'New title'] },
    object_pk: '42',
  });

  it('opens the full history modal as a Paragon dialog', async () => {
    const user = userEvent.setup();
    mockedGetAuditLogs.mockResolvedValue({ results: [entryWithChanges], count: 1 });
    renderSessionsTable();

    await waitFor(() => expect(screen.getByText('Session 42')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /full history/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Full History')).toBeInTheDocument();
  });

  it('stacks the change-details dialog over the history dialog', async () => {
    const user = userEvent.setup();
    mockedGetAuditLogs.mockResolvedValue({ results: [entryWithChanges], count: 1 });
    renderSessionsTable();

    await waitFor(() => expect(screen.getByText('Session 42')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /full history/i }));
    await screen.findByText('Full History');

    await user.click(await screen.findByRole('button', { name: /1 field changed/i }));

    await screen.findByText(/Change Details/);
    expect(screen.getByText('Full History')).toBeInTheDocument();
    expect(screen.getByText('New title')).toBeInTheDocument();
    expect(screen.getByText('Old title')).toBeInTheDocument();
  });

  it('labels an approved leave request as "Approved"', async () => {
    mockedGetAuditLogs.mockResolvedValue({
      results: [buildEntry({
        record_type: 'leaverequest',
        object_repr: 'Leave 9',
        changes: { state: ['pending', 'approved'] },
      })],
      count: 1,
    });
    renderSessionsTable({ models: ['leaverequest'] });
    expect(await screen.findByText('Approved')).toBeInTheDocument();
  });
});
