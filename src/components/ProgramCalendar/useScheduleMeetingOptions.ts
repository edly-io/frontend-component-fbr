import { useMemo } from 'react';
import { SelectOption } from '../SearchableSelect';
import { ApiRecord } from '../../data/types';
import { useConfig } from '../../data/config/hooks';
import { useLocations } from '../../data/locations/hooks';
import { useProgramCourses, useProgramInstructors } from '../../data/programs/hooks';
import { useApprovedLeaves } from '../../data/requests/hooks';

const LOCATIONS_PAGE_SIZE = 100;
const NO_OPTIONS: SelectOption[] = [];
const NO_LEAVES: ApiRecord[] = [];

export interface SessionTypeOption {
  value: string;
  label: string;
}

interface ScheduleMeetingOptionsParams {
  isOpen: boolean;
  programKey: string;
  descriptionOnly: boolean;
  isPastSession: boolean;
  /** Scopes the instructor list; null lists every instructor in the program's city. */
  instructorsCourseId: string | null;
  /** False while a lecture still has no course picked: there is nothing to list yet. */
  canListInstructors: boolean;
}

const toCourseOption = (course: ApiRecord): SelectOption => ({
  value: course.course_key as string,
  label: course.display_name as string,
});

const toInstructorOption = (instructor: ApiRecord): SelectOption => ({
  value: instructor.id as number,
  label: `${instructor.first_name} ${instructor.last_name}`.trim() || (instructor.username as string),
  email: instructor.email,
});

const toLocationOption = (location: ApiRecord): SelectOption => ({
  value: location.id as number,
  label: location.name as string,
});

/**
 * Everything the schedule form picks from. Description-only (instructor) mode
 * skips the admin-only course and instructor lookups. A disabled lookup yields
 * no options even when an earlier lookup with the same key is cached.
 */
const useScheduleMeetingOptions = ({
  isOpen, programKey, descriptionOnly, isPastSession, instructorsCourseId, canListInstructors,
}: ScheduleMeetingOptionsParams) => {
  const coursesEnabled = isOpen && !descriptionOnly && Boolean(programKey);
  const instructorsEnabled = isOpen && !descriptionOnly && Boolean(programKey) && canListInstructors;
  const leavesEnabled = isOpen && Boolean(programKey) && !descriptionOnly && !isPastSession;

  const courses = useProgramCourses(programKey, coursesEnabled);
  const instructors = useProgramInstructors(programKey, instructorsCourseId, instructorsEnabled);
  const locations = useLocations({ pageSize: LOCATIONS_PAGE_SIZE, programKey }, isOpen);
  const leaves = useApprovedLeaves({ program_key: programKey }, leavesEnabled);
  const config = useConfig();

  const courseRunOptions = useMemo(
    () => (coursesEnabled && courses.data ? courses.data.map(toCourseOption) : NO_OPTIONS),
    [coursesEnabled, courses.data],
  );
  const instructorOptions = useMemo(
    () => (instructorsEnabled && instructors.data ? instructors.data.map(toInstructorOption) : NO_OPTIONS),
    [instructorsEnabled, instructors.data],
  );
  const locationOptions = useMemo(
    () => (locations.data ? locations.data.results.map(toLocationOption) : NO_OPTIONS),
    [locations.data],
  );

  return {
    courseRunOptions,
    courseRunsLoading: courses.isLoading,
    instructorOptions,
    instructorsLoading: instructors.isLoading,
    locationOptions,
    locationsLoading: locations.isLoading,
    approvedLeaves: (leavesEnabled && leaves.data) || NO_LEAVES,
    sessionTypeOptions: (config.data?.session_types as SessionTypeOption[] | undefined) || [],
    lectureDurations: (config.data?.lecture_duration_choices_minutes as number[] | undefined) || null,
  };
};

export default useScheduleMeetingOptions;
