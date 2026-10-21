import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import {
  fetchProgramCourses,
  fetchProgramInstructors,
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

describe('fetchProgramCourses', () => {
  it('fetches from /programs/<key>/courses/ and returns array', async () => {
    const courses = [{ course_key: 'course-v1:Org+C+R', display_name: 'Intro' }];
    mockClient.get.mockResolvedValue({ data: courses });
    const result = await fetchProgramCourses('program-v1:Org+P+1');
    expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('/programs/program-v1%3AOrg%2BP%2B1/courses/'));
    expect(result).toEqual(courses);
  });
});

describe('fetchProgramInstructors', () => {
  it('fetches from /programs/users/ with no_page and returns array', async () => {
    const users = [{
      id: 1, email: 'a@b.com', first_name: 'Alice', last_name: 'A',
    }];
    mockClient.get.mockResolvedValue({ data: users });
    const result = await fetchProgramInstructors('program-v1:Org+P+1');
    expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('no_page'));
    expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('role=instructor'));
    expect(result).toEqual(users);
  });
});
