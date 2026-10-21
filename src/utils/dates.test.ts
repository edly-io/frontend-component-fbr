import {
  formatDateTime,
  toISOString,
  toDateTimeLocal,
  bucketSessionsByDay,
  isLeaveStartDatePast,
  formatLeaveDate,
  formatLeaveRange,
  toLocalDateStr,
} from './dates';

describe('formatDateTime', () => {
  it('returns empty string for empty string', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(formatDateTime(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDateTime(undefined)).toBe('');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDateTime('2026-06-01T10:00:00.000Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
  });
});

describe('toISOString', () => {
  it('returns empty string for empty string', () => {
    expect(toISOString('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(toISOString(null)).toBe('');
  });

  it('converts a datetime-local string to ISO', () => {
    const result = toISOString('2026-06-01T10:00');
    expect(result).toMatch(/2026-06-01/);
  });
});

describe('toDateTimeLocal', () => {
  it('returns empty string for empty string', () => {
    expect(toDateTimeLocal('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(toDateTimeLocal(null)).toBe('');
  });

  it('returns a YYYY-MM-DDTHH:MM formatted string', () => {
    const result = toDateTimeLocal('2026-06-01T10:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('bucketSessionsByDay', () => {
  it('returns an empty Map for an empty array', () => {
    const result = bucketSessionsByDay([]);
    expect(result.size).toBe(0);
  });

  it('groups sessions on the same day together', () => {
    const sessions = [
      { id: 1, scheduled_start_time: '2026-06-01T10:00:00' },
      { id: 2, scheduled_start_time: '2026-06-01T14:00:00' },
      { id: 3, scheduled_start_time: '2026-06-02T09:00:00' },
    ];
    const result = bucketSessionsByDay(sessions);
    expect(result.size).toBe(2);
    expect(result.get('2026-06-01')).toHaveLength(2);
    expect(result.get('2026-06-02')).toHaveLength(1);
  });

  it('ignores sessions without scheduled_start_time', () => {
    const sessions = [
      { id: 1 },
      { id: 2, scheduled_start_time: '2026-06-01T10:00:00' },
    ];
    const result = bucketSessionsByDay(sessions);
    expect(result.size).toBe(1);
  });

  it('preserves session order within a day', () => {
    const sessions = [
      { id: 1, scheduled_start_time: '2026-06-01T10:00:00' },
      { id: 2, scheduled_start_time: '2026-06-01T08:00:00' },
    ];
    const result = bucketSessionsByDay(sessions);
    const day = result.get('2026-06-01') ?? [];
    expect(day[0].id).toBe(1);
    expect(day[1].id).toBe(2);
  });
});

describe('isLeaveStartDatePast', () => {
  const isoDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  };

  it('returns false for null/undefined request', () => {
    expect(isLeaveStartDatePast(null)).toBe(false);
    expect(isLeaveStartDatePast(undefined)).toBe(false);
  });

  it('returns false when leave_start_date is missing', () => {
    expect(isLeaveStartDatePast({})).toBe(false);
  });

  it('returns true when the start date is before today', () => {
    expect(isLeaveStartDatePast({ leave_start_date: isoDate(-1) })).toBe(true);
  });

  it('returns false when the start date is today', () => {
    expect(isLeaveStartDatePast({ leave_start_date: isoDate(0) })).toBe(false);
  });

  it('returns false when the start date is in the future', () => {
    expect(isLeaveStartDatePast({ leave_start_date: isoDate(1) })).toBe(false);
  });
});

describe('formatLeaveDate', () => {
  it('returns empty string for a falsy value', () => {
    expect(formatLeaveDate('')).toBe('');
    expect(formatLeaveDate(null)).toBe('');
  });

  it('formats a date-only value without timezone drift', () => {
    expect(formatLeaveDate('2026-07-10')).toBe('Jul 10, 2026');
  });
});

describe('formatLeaveRange', () => {
  it('returns a single date when start equals end', () => {
    expect(formatLeaveRange({ leave_start_date: '2026-07-10', leave_end_date: '2026-07-10' }))
      .toBe('Jul 10, 2026');
  });

  it('returns a single date when end is missing', () => {
    expect(formatLeaveRange({ leave_start_date: '2026-07-10' })).toBe('Jul 10, 2026');
  });

  it('returns a range when start and end differ', () => {
    expect(formatLeaveRange({ leave_start_date: '2026-07-10', leave_end_date: '2026-07-12' }))
      .toBe('Jul 10, 2026 – Jul 12, 2026');
  });

  it('returns empty string when there is no start date', () => {
    expect(formatLeaveRange({})).toBe('');
  });
});

describe('toLocalDateStr', () => {
  // Timezone-independent: the CI runner is UTC, so we can't assert a specific
  // UTC/local divergence. Instead we verify the guarantee that matters — the
  // returned string tracks the date's LOCAL calendar day — which holds in any
  // timezone. (The bug being fixed was using toISOString(), which reports the
  // UTC day and shifts a day in non-zero offsets.)
  const localDay = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  it('formats a midnight-local date as its local calendar day', () => {
    const midnightLocal = new Date(2026, 8, 11); // Sept 11 2026, 00:00 local
    expect(toLocalDateStr(midnightLocal)).toBe('2026-09-11');
  });

  it('tracks the local day, not the UTC day', () => {
    // An instant a couple of hours into UTC Sept 11; toLocalDateStr must equal
    // the date's own local components in whatever zone the test runs.
    const d = new Date('2026-09-11T02:00:00Z');
    expect(toLocalDateStr(d)).toBe(localDay(d));
  });
});
