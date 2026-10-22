import { formatDuration, getStatusVariant, extractApiError } from './format';

describe('formatDuration', () => {
  it('returns 0m for zero', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('returns 0m for null', () => {
    expect(formatDuration(null)).toBe('0m');
  });

  it('formats seconds into minutes only', () => {
    expect(formatDuration(1800)).toBe('30m');
  });

  it('formats seconds into hours and minutes', () => {
    expect(formatDuration(3661)).toBe('1h 1m');
  });

  it('formats exact hours with 0 minutes', () => {
    expect(formatDuration(7200)).toBe('2h 0m');
  });

  it('formats 59 minutes', () => {
    expect(formatDuration(3540)).toBe('59m');
  });
});

describe('getStatusVariant', () => {
  it('returns success for present', () => {
    expect(getStatusVariant('present')).toBe('success');
  });

  it('returns danger for absent', () => {
    expect(getStatusVariant('absent')).toBe('danger');
  });

  it('returns warning for leave', () => {
    expect(getStatusVariant('leave')).toBe('warning');
  });

  it('returns secondary for pending', () => {
    expect(getStatusVariant('pending')).toBe('secondary');
  });

  it('returns success for completed', () => {
    expect(getStatusVariant('completed')).toBe('success');
  });

  it('returns danger for cancelled', () => {
    expect(getStatusVariant('cancelled')).toBe('danger');
  });

  it('returns secondary for unknown status', () => {
    expect(getStatusVariant('unknown_status')).toBe('secondary');
  });
});

describe('extractApiError', () => {
  it('extracts detail from response data', () => {
    expect(extractApiError({ response: { data: { detail: 'Not found' } } })).toBe('Not found');
  });

  it('extracts error from response data when no detail', () => {
    expect(extractApiError({ response: { data: { error: 'Bad request' } } })).toBe('Bad request');
  });

  it('falls back to err.message when no response', () => {
    expect(extractApiError({ message: 'Network error' })).toBe('Network error');
  });

  it('uses provided fallback when nothing is available', () => {
    expect(extractApiError({}, 'fallback msg')).toBe('fallback msg');
  });

  it('uses default fallback when nothing is available', () => {
    expect(extractApiError({})).toBe('An unexpected error occurred');
  });

  it('prefers detail over error', () => {
    expect(extractApiError({ response: { data: { detail: 'detail msg', error: 'err msg' } } })).toBe('detail msg');
  });

  it('joins DRF field-level validation errors', () => {
    const err = { response: { data: { name: ['This field is required.'], reason: ['Too short.'] } } };
    const result = extractApiError(err);
    expect(result).toContain('name: This field is required.');
    expect(result).toContain('reason: Too short.');
  });

  it('extracts non_field_errors without prefixing the field name', () => {
    const err = { response: { data: { non_field_errors: ['Duplicate entry.'] } } };
    expect(extractApiError(err)).toBe('Duplicate entry.');
  });

  it('handles a plain string response body', () => {
    expect(extractApiError({ response: { data: 'Internal server error' } })).toBe('Internal server error');
  });
});
