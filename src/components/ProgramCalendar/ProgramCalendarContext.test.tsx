import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgramCalendarProvider, useProgramCalendar } from './ProgramCalendarContext';

const Probe = () => {
  const { programKey, basePath } = useProgramCalendar();
  return <span>{`${programKey} ${basePath}`}</span>;
};

describe('useProgramCalendar', () => {
  it('returns the provided program key and base path', () => {
    render(
      <ProgramCalendarProvider programKey="K" basePath="/programs/K">
        <Probe />
      </ProgramCalendarProvider>,
    );
    expect(screen.getByText('K /programs/K')).toBeInTheDocument();
  });

  it('throws a clear error outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useProgramCalendar must be used inside a ProgramCalendarProvider');
    consoleError.mockRestore();
  });
});
