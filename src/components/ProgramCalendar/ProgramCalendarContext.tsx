import React, { createContext, useContext, useMemo } from 'react';
import { ProgramCalendarContextValue } from './types';

const ProgramCalendarContext = createContext<ProgramCalendarContextValue | null>(null);

interface ProgramCalendarProviderProps extends ProgramCalendarContextValue {
  children: React.ReactNode;
}

/** Gives calendar components the program they show and the host app's router path to it. */
export const ProgramCalendarProvider = ({ programKey, basePath, children }: ProgramCalendarProviderProps) => {
  const value = useMemo(() => ({ programKey, basePath }), [programKey, basePath]);
  return <ProgramCalendarContext.Provider value={value}>{children}</ProgramCalendarContext.Provider>;
};

export const useProgramCalendar = (): ProgramCalendarContextValue => {
  const value = useContext(ProgramCalendarContext);
  if (!value) {
    throw new Error('useProgramCalendar must be used inside a ProgramCalendarProvider');
  }
  return value;
};
