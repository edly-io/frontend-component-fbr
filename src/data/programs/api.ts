import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getProgramsApiUrl } from '../urls';
import { ApiRecord } from '../types';

const listFrom = (data: ApiRecord[] | { results?: ApiRecord[] }): ApiRecord[] => (
  Array.isArray(data) ? data : (data.results ?? [])
);

export const getProgram = async (programKey: string): Promise<ApiRecord> => {
  const { data } = await getAuthenticatedHttpClient().get(getProgramsApiUrl(`${programKey}/`));
  return data;
};

/** Course runs in a program: [{ course_key, display_name, ... }]. */
export const fetchProgramCourses = async (programKey: string): Promise<ApiRecord[]> => {
  const { data } = await getAuthenticatedHttpClient().get(
    getProgramsApiUrl(`${encodeURIComponent(programKey)}/courses/`),
  );
  return listFrom(data);
};

/**
 * Instructors for a program, scoped to the program's city by the backend.
 * `no_page` returns a plain array in one request.
 */
export const fetchProgramInstructors = async (
  programKey: string,
  courseId: string | null = null,
): Promise<ApiRecord[]> => {
  let path = `users/?role=instructor&no_page&program_key=${encodeURIComponent(programKey)}`;
  if (courseId) { path += `&course_id=${encodeURIComponent(courseId)}`; }
  const { data } = await getAuthenticatedHttpClient().get(getProgramsApiUrl(path));
  return listFrom(data);
};
