import React from 'react';
import classNames from 'classnames';
import { SearchableSelect, SelectOption } from '../SearchableSelect';
import { ProgramInfo } from './types';

interface SessionPickersProps {
  courseRunOptions: SelectOption[];
  courseRunsLoading: boolean;
  selectedCourseRun: SelectOption | null;
  onCourseRunChange: (option: SelectOption | null) => void;
  instructorOptions: SelectOption[];
  instructorsLoading: boolean;
  selectedInstructors: SelectOption[];
  onInstructorsChange: (options: SelectOption[]) => void;
  instructorLeaveError: string;
  locationOptions: SelectOption[];
  locationsLoading: boolean;
  selectedLocation: SelectOption | null;
  onLocationChange: (option: SelectOption | null) => void;
  programInfo?: ProgramInfo | null;
  isPastSession: boolean;
  isSessionType: boolean;
  descriptionOnly: boolean;
  invalidInstructors: boolean;
  invalidLocation: boolean;
}

interface InstructorScopeHintProps {
  course: SelectOption | null;
  programInfo?: ProgramInfo | null;
}

const InstructorScopeHint = ({ course, programInfo }: InstructorScopeHintProps) => {
  if (course) {
    return <>Only instructors assigned to <strong>{course.label}</strong> are shown.</>;
  }
  if (!programInfo?.city?.name) { return null; }
  return <>Only instructors from <strong>{programInfo.city.name}</strong> are shown.</>;
};

/** The course, instructor and location pickers, with the hints that explain each list's scope. */
const SessionPickers = ({
  courseRunOptions, courseRunsLoading, selectedCourseRun, onCourseRunChange,
  instructorOptions, instructorsLoading, selectedInstructors, onInstructorsChange, instructorLeaveError,
  locationOptions, locationsLoading, selectedLocation, onLocationChange,
  programInfo, isPastSession, isSessionType, descriptionOnly, invalidInstructors, invalidLocation,
}: SessionPickersProps) => {
  const canPickInstructors = isPastSession || Boolean(selectedCourseRun) || !isSessionType;
  return (
    <>
      <SearchableSelect
        id="session-course-run"
        label="Course"
        options={courseRunOptions}
        value={selectedCourseRun}
        onChange={onCourseRunChange}
        placeholder="Search by course title..."
        loading={courseRunsLoading}
        required={isSessionType && !descriptionOnly}
        disabled={descriptionOnly}
      />
      {!descriptionOnly && programInfo?.name && (
        <small className="text-muted d-block fbr-schedule-meeting__field-hint">
          Only courses added to the <strong>{programInfo.name}</strong> program are shown.
        </small>
      )}

      <SearchableSelect
        id="session-instructor"
        label="Instructor"
        options={instructorOptions}
        value={selectedInstructors}
        onChange={onInstructorsChange}
        multiple
        placeholder={canPickInstructors ? 'Search by name...' : 'Select a course first'}
        loading={instructorsLoading}
        disabled={descriptionOnly || !canPickInstructors}
        required={isSessionType && !descriptionOnly}
        isInvalid={invalidInstructors || !!instructorLeaveError}
      />
      {instructorLeaveError && (
        <div className="fbr-schedule-meeting__leave-error">{instructorLeaveError}</div>
      )}
      {!descriptionOnly && (
        <small
          className={classNames('text-muted d-block fbr-schedule-meeting__field-hint', {
            'fbr-schedule-meeting__field-hint--after-error': instructorLeaveError,
          })}
        >
          <InstructorScopeHint course={selectedCourseRun} programInfo={programInfo} />
        </small>
      )}

      <SearchableSelect
        id="session-location"
        label="Location"
        options={locationOptions}
        value={selectedLocation}
        onChange={onLocationChange}
        placeholder={locationsLoading ? 'Loading locations…' : 'Search locations…'}
        loading={locationsLoading}
        required={!isPastSession && isSessionType && !descriptionOnly}
        isInvalid={invalidLocation}
        disabled={descriptionOnly}
      />
    </>
  );
};

export default SessionPickers;
