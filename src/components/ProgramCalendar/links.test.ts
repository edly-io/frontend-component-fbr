import { buildAuditPath, buildRosterPath } from './links';

describe('buildRosterPath', () => {
  it('strips a trailing slash and encodes the course id', () => {
    expect(buildRosterPath('/programs/K/', 5, 'course-v1:X'))
      .toBe('/programs/K/attendance/sessions/5?course_id=course-v1%3AX');
  });

  it('builds the same path without a trailing slash', () => {
    expect(buildRosterPath('/programs/K', 5, 'course-v1:X'))
      .toBe('/programs/K/attendance/sessions/5?course_id=course-v1%3AX');
  });

  it('adds no query when there is no course', () => {
    expect(buildRosterPath('/programs/K/', 5)).toBe('/programs/K/attendance/sessions/5');
    expect(buildRosterPath('/programs/K', 5, null)).toBe('/programs/K/attendance/sessions/5');
    expect(buildRosterPath('/programs/K', 5, '')).toBe('/programs/K/attendance/sessions/5');
  });
});

describe('buildAuditPath', () => {
  it('strips a trailing slash', () => {
    expect(buildAuditPath('/programs/K/', 5)).toBe('/programs/K/calendar?view=audit-log&record_id=5');
  });

  it('builds the same path without a trailing slash', () => {
    expect(buildAuditPath('/programs/K', 5)).toBe('/programs/K/calendar?view=audit-log&record_id=5');
  });
});
