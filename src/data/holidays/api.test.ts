import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import {
  getHolidays,
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

describe('getHolidays', () => {
  it('fetches from /public-holidays/ with pagination params', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getHolidays({ page: 2, pageSize: 10 });
    const [url] = mockClient.get.mock.calls[0];
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=10');
  });

  it('includes search param when provided', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getHolidays({ search: 'eid' });
    const [url] = mockClient.get.mock.calls[0];
    expect(url).toContain('search=eid');
  });

  it('includes the date range when provided', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getHolidays({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
    const [url] = mockClient.get.mock.calls[0];
    expect(url).toContain('date_from=2026-02-01');
    expect(url).toContain('date_to=2026-02-28');
  });

  it('omits the date range when not provided', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getHolidays();
    const [url] = mockClient.get.mock.calls[0];
    expect(url).not.toContain('date_from');
    expect(url).not.toContain('date_to');
  });

  it('returns count and results', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 1, results: [{ id: 1 }] } });
    const result = await getHolidays();
    expect(result).toEqual({ count: 1, results: [{ id: 1 }] });
  });

  it('returns zeros for missing fields', async () => {
    mockClient.get.mockResolvedValue({ data: {} });
    const result = await getHolidays();
    expect(result).toEqual({ count: 0, results: [] });
  });
});
