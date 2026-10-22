import { getAttendanceApiUrl, getAuditLogsApiUrl, getProgramsApiUrl } from './urls';

describe('API URL builders', () => {
  it('builds attendance API URLs on the LMS host', () => {
    expect(getAttendanceApiUrl('sessions/')).toBe('http://lms.test/fbr/api/attendance/v1/sessions/');
  });

  it('builds programs API URLs on the Studio host', () => {
    expect(getProgramsApiUrl('K/')).toBe('http://studio.test/fbr/api/programs/K/');
  });

  it('builds the programs API root when no path is given', () => {
    expect(getProgramsApiUrl()).toBe('http://studio.test/fbr/api/programs/');
  });

  it('builds audit log API URLs on the LMS host', () => {
    expect(getAuditLogsApiUrl('logs/')).toBe('http://lms.test/fbr/api/audit-logs/v1/logs/');
  });
});
