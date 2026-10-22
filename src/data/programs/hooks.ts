import { useQuery } from '@tanstack/react-query';
import { fbrKeys, FBR_QUERY_OPTIONS } from '../queryDefaults';
import { fetchProgramCourses, fetchProgramInstructors, getProgram } from './api';

export const useProgram = (programKey: string) => useQuery({
  queryKey: fbrKeys.program(programKey),
  queryFn: () => getProgram(programKey),
  ...FBR_QUERY_OPTIONS,
  enabled: Boolean(programKey),
});

export const useProgramCourses = (programKey: string, enabled = true) => useQuery({
  queryKey: fbrKeys.programCourses(programKey),
  queryFn: () => fetchProgramCourses(programKey),
  ...FBR_QUERY_OPTIONS,
  enabled: enabled && Boolean(programKey),
});

export const useProgramInstructors = (programKey: string, courseId: string | null = null, enabled = true) => useQuery({
  queryKey: fbrKeys.programInstructors(programKey, courseId),
  queryFn: () => fetchProgramInstructors(programKey, courseId),
  ...FBR_QUERY_OPTIONS,
  enabled: enabled && Boolean(programKey),
});
