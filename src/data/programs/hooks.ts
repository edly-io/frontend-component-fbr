import { useQuery } from '@tanstack/react-query';
import { fbrKeys, STALE_TIME_MS } from '../queryDefaults';
import { fetchProgramCourses, fetchProgramInstructors, getProgram } from './api';

export const useProgram = (programKey: string) => useQuery({
  queryKey: fbrKeys.program(programKey),
  queryFn: () => getProgram(programKey),
  staleTime: STALE_TIME_MS,
  enabled: Boolean(programKey),
});

export const useProgramCourses = (programKey: string, enabled = true) => useQuery({
  queryKey: fbrKeys.programCourses(programKey),
  queryFn: () => fetchProgramCourses(programKey),
  staleTime: STALE_TIME_MS,
  enabled: enabled && Boolean(programKey),
});

export const useProgramInstructors = (programKey: string, courseId: string | null = null, enabled = true) => useQuery({
  queryKey: fbrKeys.programInstructors(programKey, courseId),
  queryFn: () => fetchProgramInstructors(programKey, courseId),
  staleTime: STALE_TIME_MS,
  enabled: enabled && Boolean(programKey),
});
