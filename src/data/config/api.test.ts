import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import {
  getSessionsConfig,
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

describe('getSessionsConfig', () => {
  it('fetches from /config/', async () => {
    mockClient.get.mockResolvedValue({ data: { user_role: 'admin' } });
    const result = await getSessionsConfig();
    expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('/config/'));
    expect(result).toEqual({ user_role: 'admin' });
  });
});

// ─── getProgramDates ──────────────────────────────────────────────────────────
