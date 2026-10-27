import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import {
  getApprovedLeaves,
  getLeaveUsage,
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

describe('getApprovedLeaves', () => {
  it('always sends state=APPROVED', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [] } });
    await getApprovedLeaves({ program_key: 'prog1' });
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('state=APPROVED'),
    );
  });

  it('includes program_key in query string', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [] } });
    await getApprovedLeaves({ program_key: 'my-prog' });
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('program_key=my-prog'),
    );
  });

  it('sends leave_date when given, so only leaves covering that day come back', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [] } });
    await getApprovedLeaves({ program_key: 'prog1', leave_date: '2026-11-10' });
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('leave_date=2026-11-10'),
    );
  });

  it('omits leave_date when not given', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [] } });
    await getApprovedLeaves({ program_key: 'prog1' });
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.not.stringContaining('leave_date'),
    );
  });

  it('returns results array from paginated response', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [{ id: 1 }] } });
    const result = await getApprovedLeaves({});
    expect(result).toEqual([{ id: 1 }]);
  });

  it('handles flat array response', async () => {
    mockClient.get.mockResolvedValue({ data: [{ id: 2 }] });
    const result = await getApprovedLeaves({});
    expect(result).toEqual([{ id: 2 }]);
  });
});

// ─── reviewRequest ────────────────────────────────────────────────────────────

describe('getLeaveUsage', () => {
  it('GETs the leave-usage endpoint with program_key', async () => {
    const usageData = { program_key: 'prog1', threshold: 7, leaves: [] };
    mockClient.get.mockResolvedValue({ data: usageData });
    const result = await getLeaveUsage({ program_key: 'prog1' });
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/leave-usage/'),
    );
    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('program_key=prog1'),
    );
    expect(result).toEqual(usageData);
  });

  it('includes q param when provided', async () => {
    mockClient.get.mockResolvedValue({ data: { threshold: 7, leaves: [] } });
    await getLeaveUsage({ program_key: 'prog1', q: 'alice' });
    expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('q=alice'));
  });

  it('includes threshold_exceeded flag when threshold_exceeded param is true', async () => {
    mockClient.get.mockResolvedValue({ data: { threshold: 7, leaves: [] } });
    await getLeaveUsage({ program_key: 'prog1', threshold_exceeded: true });
    expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('threshold_exceeded'));
  });
});

// ─── bulkApproveLeaves ────────────────────────────────────────────────────────
