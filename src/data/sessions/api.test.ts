import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import {
  getCalendarSessions,
  createSession,
  updateSession,
  cancelSession,
  deleteSession,
  getProgramDates,
  getSessions,
  getSessionApprovedLeaves,
} from './api';

jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedHttpClient: jest.fn(),
}));
jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn().mockReturnValue({
    LMS_BASE_URL: 'http://localhost:18000',
    STUDIO_BASE_URL: 'http://localhost:18010',
  }),
}));

const mockClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

beforeAll(() => {
  (getAuthenticatedHttpClient as jest.Mock).mockReturnValue(mockClient);
});

beforeEach(() => jest.clearAllMocks());

describe('getCalendarSessions', () => {
  it('sends start_date and end_date as query params', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [], user_role: 'learner' } });
    await getCalendarSessions('2026-06-01', '2026-06-30', 'prog1');
    const [url] = mockClient.get.mock.calls[0];
    expect(url).toContain('start_date=2026-06-01');
    expect(url).toContain('end_date=2026-06-30');
  });

  it('includes program_key when provided', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [], user_role: 'admin' } });
    await getCalendarSessions('2026-06-01', '2026-06-30', 'prog1');
    const [url] = mockClient.get.mock.calls[0];
    expect(url).toContain('program_key=prog1');
  });

  it('omits program_key when not provided', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [], user_role: 'learner' } });
    await getCalendarSessions('2026-06-01', '2026-06-30');
    const [url] = mockClient.get.mock.calls[0];
    expect(url).not.toContain('program_key');
  });

  it('returns sessions array and userRole', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [{ id: 's1' }], user_role: 'admin' } });
    const result = await getCalendarSessions('2026-06-01', '2026-06-30');
    expect(result).toEqual({ sessions: [{ id: 's1' }], userRole: 'admin' });
  });
});

// ─── createSession ────────────────────────────────────────────────────────────

describe('createSession', () => {
  it('posts to /sessions/ and returns data', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 'new' } });
    const result = await createSession({ title: 'Test Session' });
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/'),
      { title: 'Test Session' },
    );
    expect(result).toEqual({ id: 'new' });
  });
});

// ─── updateSession ────────────────────────────────────────────────────────────

describe('updateSession', () => {
  it('patches the session by id', async () => {
    mockClient.patch.mockResolvedValue({ data: { id: 'abc', title: 'Updated' } });
    const result = await updateSession('abc', { title: 'Updated' });
    expect(mockClient.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc/'),
      { title: 'Updated' },
    );
    expect(result.title).toBe('Updated');
  });
});

// ─── cancelSession ────────────────────────────────────────────────────────────

describe('cancelSession', () => {
  it('posts to the cancel endpoint', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 'abc', status: 'cancelled' } });
    await cancelSession('abc');
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc/cancel/'),
    );
  });
});

// ─── deleteSession ────────────────────────────────────────────────────────────

describe('deleteSession', () => {
  it('sends DELETE to the session endpoint', async () => {
    mockClient.delete.mockResolvedValue({});
    await deleteSession('abc');
    expect(mockClient.delete).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc/'),
    );
  });
});

// ─── getSessionsConfig ────────────────────────────────────────────────────────

describe('getProgramDates', () => {
  it('flattens course date blocks into a single array', async () => {
    mockClient.get.mockResolvedValue({
      data: {
        courses: [
          {
            course_key: 'c1',
            course_name: 'Course One',
            date_blocks: [
              {
                title: 'HW1', date: '2026-06-01', assignment_type: 'Homework', complete: false, link: 'https://x',
              },
            ],
          },
          {
            course_key: 'c2',
            course_name: 'Course Two',
            date_blocks: [
              { title: 'Quiz 1', date: '2026-06-10', complete: null },
            ],
          },
        ],
      },
    });
    const result = await getProgramDates('prog1');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ courseKey: 'c1', title: 'HW1', assignmentType: 'Homework' });
    expect(result[1]).toMatchObject({ courseKey: 'c2', title: 'Quiz 1' });
  });

  it('returns empty array when no courses', async () => {
    mockClient.get.mockResolvedValue({ data: {} });
    const result = await getProgramDates('prog1');
    expect(result).toEqual([]);
  });

  it('returns empty array when course has no date_blocks', async () => {
    mockClient.get.mockResolvedValue({ data: { courses: [{ course_key: 'c1', course_name: 'C1', date_blocks: [] }] } });
    const result = await getProgramDates('prog1');
    expect(result).toEqual([]);
  });
});

// ─── fetchProgramCourses / fetchProgramInstructors ───────────────────────────

describe('getSessions', () => {
  it('GETs the sessions endpoint with start_date, end_date, and program_key', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 1, results: [{ id: 'sess1' }] } });
    await getSessions({
      program_key: 'prog1',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    });
    const url = new URL(mockClient.get.mock.calls[0][0]);
    expect(url.pathname).toContain('/sessions/');
    expect(url.searchParams.get('program_key')).toBe('prog1');
    expect(url.searchParams.get('start_date')).toBe('2026-01-01');
    expect(url.searchParams.get('end_date')).toBe('2026-12-31');
  });

  // The list is paginated: keeping the total lets callers load the rest (#534).
  it('returns one page with the total count', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 51, next: 'http://x/?page=2', results: [{ id: 'sess1' }] } });
    const result = await getSessions({ start_date: '2026-01-01', end_date: '2026-12-31' });
    expect(result).toEqual({ count: 51, results: [{ id: 'sess1' }] });
  });

  it('asks for the given page', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 51, results: [] } });
    await getSessions({ start_date: '2026-01-01', end_date: '2026-12-31', page: 2 });
    expect(new URL(mockClient.get.mock.calls[0][0]).searchParams.get('page')).toBe('2');
  });
});

// ─── getSessionApprovedLeaves ─────────────────────────────────────────────────

describe('getSessionApprovedLeaves', () => {
  it('GETs the sessions/approved-leaves endpoint with program_key', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getSessionApprovedLeaves({ program_key: 'prog1' });
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/approved-leaves/'),
    );
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('program_key=prog1'),
    );
  });

  it('includes q, page, and page_size when provided', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getSessionApprovedLeaves({
      program_key: 'prog1', q: 'Math', page: 2, page_size: 15,
    });
    const [url] = mockClient.get.mock.calls[0];
    expect(url).toContain('q=Math');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=15');
  });

  it('returns the full paginated envelope', async () => {
    const envelope = {
      count: 1, next: null, previous: null, results: [{ session_id: 's1' }],
    };
    mockClient.get.mockResolvedValue({ data: envelope });
    const result = await getSessionApprovedLeaves({ program_key: 'prog1' });
    expect(result).toEqual(envelope);
  });
});
