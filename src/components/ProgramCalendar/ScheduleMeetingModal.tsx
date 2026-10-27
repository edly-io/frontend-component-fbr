import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import classNames from 'classnames';
import {
  Alert, Button, Form, OverlayTrigger, Spinner, StandardModal, Tooltip,
} from '@openedx/paragon';
import { SelectOption } from '../SearchableSelect';
import { DATEPICKER_TYPES, DatepickerControl } from '../DatepickerControl';
import { useCorrectSession, useCreateSession, useUpdateSession } from '../../data/sessions/hooks';
import { Session } from '../../data/sessions/types';
import { ApiRecord } from '../../data/types';
import { extractApiError } from '../../utils/format';
import ConflictAlerts, { getConflictFieldErrors, SessionConflict } from './ConflictAlerts';
import RecurrenceFields from './RecurrenceFields';
import SessionPickers from './SessionPickers';
import { RecurrenceState, seedRecurrenceFromStart } from './recurrence';
import {
  buildCorrectionPayload, buildSessionPayload, CLEARED_AFTER_SAVE, combineDateTimeLocal, DEFAULT_SESSION_TYPE,
  findPrefillCourse, findPrefillInstructors, getInitialForm, ScheduleFormState,
} from './scheduleForm';
import { getInstructorLeaveError, getSchedulingWarning, validateScheduleForm } from './scheduleValidation';
import useScheduleMeetingOptions from './useScheduleMeetingOptions';
import { ScheduleMeetingModalProps, ScheduleSession } from './types';
import './ScheduleMeetingModal.scss';

const HTTP_CONFLICT = 409;
const ZOOM_REGISTRANT_REJECTED = 'zoom_registrant_rejected';
const SCROLL_DELAY_MS = 100;
const SAVE_ERROR = 'Failed to save session. Please try again.';
const DESCRIPTION_SAVE_ERROR = 'Failed to save description. Please try again.';
const NO_CHANGES_ERROR = 'No changes detected. Update the course, instructors, or location before saving.';

interface SaveError {
  message?: string;
  response?: { status?: number; data?: unknown };
}

interface ZoomRejection {
  error?: string;
  detail?: string;
  emails?: string[];
}

const scrollIntoViewSoon = (ref: React.RefObject<HTMLDivElement>) => {
  setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), SCROLL_DELAY_MS);
};

/** A past session (by end time, so an in-progress one is not past) opens in correction mode. */
const isSessionPast = (session?: ScheduleSession | null): boolean => (
  !!session && new Date((session.scheduled_end_time || session.scheduled_start_time) as string) <= new Date()
);

const getModalTitle = (session: ScheduleSession | null, isPastSession: boolean, descriptionOnly: boolean) => {
  if (descriptionOnly) { return 'Edit Description'; }
  if (isPastSession) { return 'Correct Session Details'; }
  return session ? 'Edit Session' : 'Schedule New Session';
};

const getSaveLabels = (session: ScheduleSession | null, isPastSession: boolean) => {
  if (isPastSession) { return { saving: 'Saving...', save: 'Save corrections' }; }
  if (session) { return { saving: 'Updating...', save: 'Update Session' }; }
  return { saving: 'Creating...', save: 'Create Session' };
};

interface DateTimeGroupProps {
  name: 'Start' | 'End';
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  required: boolean;
  readonly: boolean;
  showRequiredMark: boolean;
  isDateInvalid: boolean;
  isTimeInvalid: boolean;
}

const DateTimeGroup = ({
  name, date, time, onDateChange, onTimeChange, required, readonly, showRequiredMark, isDateInvalid, isTimeInvalid,
}: DateTimeGroupProps) => (
  <Form.Group className="mb-3">
    <Form.Label>{name} date and time {showRequiredMark && '*'}</Form.Label>
    <div className="row g-2">
      <div className="col-7">
        <DatepickerControl
          value={date}
          onChange={onDateChange}
          ariaLabel={`${name} date`}
          required={required}
          readonly={readonly}
          isInvalid={isDateInvalid}
        />
      </div>
      <div className="col-5">
        <DatepickerControl
          type={DATEPICKER_TYPES.time}
          value={time}
          onChange={onTimeChange}
          ariaLabel={`${name} time`}
          required={required}
          readonly={readonly}
          isInvalid={isTimeInvalid}
        />
      </div>
    </div>
  </Form.Group>
);

const ZoomHelpText = ({ session }: { session: ScheduleSession | null }) => (
  <Form.Text className="text-muted">
    {session?.meeting_id && !session?.create_zoom_meeting ? (
      <>
        This session has a Zoom meeting created from a remote-attendance
        request. Checking this opens it to all enrolled learners and
        auto-approves any pending remote requests.
      </>
    ) : (
      <>
        Only create a Zoom meeting if you plan to use it for this session.
        Remote learners get individual Zoom links when you approve their
        session requests.
      </>
    )}
  </Form.Text>
);

const ScheduleMeetingModal = ({
  isOpen, onClose, programKey = '', programInfo = null, onSuccess, session = null,
  descriptionOnly = false,
}: ScheduleMeetingModalProps) => {
  const isPastSession = isSessionPast(session);
  const [error, setError] = useState('');
  // Populated only for a Zoom registrant-rejection error (400,
  // error: 'zoom_registrant_rejected'), where the backend names exactly
  // which trainee's email Zoom rejected — every other failure leaves this
  // empty and shows just the plain `error` message.
  const [rejectedEmails, setRejectedEmails] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<ScheduleFormState>(() => getInitialForm(null));
  const [selectedCourseRun, setSelectedCourseRun] = useState<SelectOption | null>(null);
  const [selectedInstructors, setSelectedInstructors] = useState<SelectOption[]>([]);
  // Conflict detection — set when the API returns HTTP 409.
  const [conflictData, setConflictData] = useState<SessionConflict | null>(null);
  const [pendingPayload, setPendingPayload] = useState<ApiRecord | null>(null);

  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const correctSessionMutation = useCorrectSession();
  const isSaving = createSessionMutation.isPending || updateSessionMutation.isPending
    || correctSessionMutation.isPending;

  const updateForm = (patch: Partial<ScheduleFormState>) => setForm((prev) => ({ ...prev, ...patch }));
  const updateRecurrence = (patch: Partial<RecurrenceState>) => setForm((prev) => ({
    ...prev, recurrence: { ...prev.recurrence, ...patch },
  }));

  const isSessionType = form.sessionType === DEFAULT_SESSION_TYPE;
  const scheduledStart = combineDateTimeLocal(form.startDate, form.startTime);
  const scheduledEnd = combineDateTimeLocal(form.endDate, form.endTime);
  const selectedCourseRunId = (selectedCourseRun?.value as string | undefined) ?? null;

  // In correction mode the instructor list is the whole city's (the course itself
  // may be changing, so scoping to the old course is misleading). Otherwise it is
  // scoped to the picked course; a lecture lists nobody until a course is picked.
  const {
    courseRunOptions, courseRunsLoading, instructorOptions, instructorsLoading, locationOptions,
    locationsLoading, approvedLeaves, leavesLoading, holidays, sessionTypeOptions, lectureDurations,
  } = useScheduleMeetingOptions({
    isOpen,
    programKey,
    descriptionOnly,
    isPastSession,
    startDate: form.startDate,
    instructorsCourseId: isPastSession ? null : selectedCourseRunId,
    canListInstructors: isPastSession || Boolean(selectedCourseRunId) || !isSessionType,
  });

  const fieldErrors = useMemo(() => getConflictFieldErrors(conflictData), [conflictData]);

  // Approved-leave conflict — front-end check before submitting.
  const instructorLeaveError = useMemo(() => (
    isPastSession ? '' : getInstructorLeaveError(selectedInstructors, form.startDate, approvedLeaves)
  ), [selectedInstructors, form.startDate, approvedLeaves, isPastSession]);

  // Soft scheduling warning — a weekend or public holiday. Does not block submission.
  const schedulingWarning = useMemo(() => (
    isPastSession ? '' : getSchedulingWarning(form.startDate, holidays)
  ), [form.startDate, holidays, isPastSession]);

  useEffect(() => {
    if (conflictData) { scrollIntoViewSoon(conflictRef); }
  }, [conflictData]);

  // Pre-fill the course run once options are loaded (edit mode only).
  useEffect(() => {
    if (!isOpen || !session) { return; }
    const course = findPrefillCourse(session, courseRunOptions, descriptionOnly);
    if (course) { setSelectedCourseRun(course); }
  }, [courseRunOptions, session, isOpen, descriptionOnly]);

  // A new course (or session type) means a new instructor list, so drop the
  // picks. Correction mode keeps them: its list does not depend on the course.
  // Declared before the instructor pre-fill so a cached list re-fills straight after.
  useEffect(() => {
    if (descriptionOnly || !programKey || isPastSession) { return; }
    setSelectedInstructors([]);
  }, [descriptionOnly, isPastSession, isOpen, selectedCourseRunId, isSessionType, programKey]);

  // Pre-fill instructors once options are loaded (edit mode only), in the
  // order the backend returns `instructor_emails`.
  useEffect(() => {
    if (!isOpen || !session) { return; }
    const instructors = findPrefillInstructors(session, instructorOptions, descriptionOnly);
    if (instructors.length > 0) { setSelectedInstructors(instructors); }
  }, [instructorOptions, session, isOpen, descriptionOnly]);

  // Reset the form whenever the modal opens or switches session.
  useEffect(() => {
    setForm(getInitialForm(session));
    if (!session) {
      setSelectedCourseRun(null);
      setSelectedInstructors([]);
    }
  }, [session, isOpen]);

  // A new series repeats on the start date's weekday / day of month by default.
  useEffect(() => {
    const baseDateTime = scheduledStart || (form.startDate ? `${form.startDate}T00:00` : '');
    if (session || !baseDateTime) { return; }
    const seeded = seedRecurrenceFromStart(baseDateTime);
    setForm((prev) => ({ ...prev, recurrence: { ...prev.recurrence, ...seeded } }));
  }, [scheduledStart, form.startDate, session]);

  const showError = (message: string) => {
    setError(message);
    scrollIntoViewSoon(errorRef);
  };

  // A Zoom registrant rejection names the trainee(s); every other failure
  // shows the plain fallback message extractApiError already produces.
  const setSessionSaveError = (err: SaveError) => {
    const data = err.response?.data as ZoomRejection | undefined;
    if (data?.error === ZOOM_REGISTRANT_REJECTED) {
      setError(data.detail ?? '');
      setRejectedEmails(data.emails || []);
    } else {
      setError(extractApiError(err, SAVE_ERROR));
    }
  };

  const handleSaveError = (err: SaveError) => {
    if (err.response?.status === HTTP_CONFLICT) {
      setConflictData(err.response.data as SessionConflict);
    } else {
      setSessionSaveError(err);
    }
  };

  const finishSave = (result: Session) => {
    onSuccess(result);
    updateForm(CLEARED_AFTER_SAVE);
  };

  const saveSession = (payload: ApiRecord) => (session
    ? updateSessionMutation.mutateAsync({ sessionId: session.id, sessionData: payload })
    : createSessionMutation.mutateAsync(payload));

  // Description-only mode (instructor editing their own session).
  const saveDescription = async () => {
    try {
      finishSave(await updateSessionMutation.mutateAsync({
        sessionId: (session as ScheduleSession).id,
        sessionData: { description: form.description },
      }));
    } catch (err) {
      setError(extractApiError(err as SaveError, DESCRIPTION_SAVE_ERROR));
    }
  };

  // Correction mode: a minimal diff of the fields that actually changed.
  // Validation already guarantees a course and at least one instructor.
  const saveCorrection = async (pastSession: ScheduleSession) => {
    const correctionPayload = buildCorrectionPayload(
      pastSession,
      selectedCourseRun as SelectOption,
      selectedInstructors,
      form.location,
    );
    if (!Object.keys(correctionPayload).length) {
      setError(NO_CHANGES_ERROR);
      return;
    }
    try {
      finishSave(await correctSessionMutation.mutateAsync({
        sessionId: pastSession.id,
        sessionData: correctionPayload,
      }));
    } catch (err) {
      handleSaveError(err as SaveError);
    }
  };

  // Normal mode: full scheduling edit / create.
  const saveSchedule = async () => {
    const sessionData = buildSessionPayload({
      programKey, form, course: selectedCourseRun, instructors: selectedInstructors, isNewSession: !session,
    });
    setPendingPayload(sessionData);
    try {
      finishSave(await saveSession(sessionData));
    } catch (err) {
      handleSaveError(err as SaveError);
    }
  };

  const validationError = () => validateScheduleForm({
    isPastSession,
    isSessionType,
    title: form.title,
    hasCourse: Boolean(selectedCourseRun),
    instructorCount: selectedInstructors.length,
    hasLocation: Boolean(form.location),
    scheduledStart,
    scheduledEnd,
    startDate: form.startDate,
    lectureDurations,
    isRecurring: form.isRecurring,
    recurrence: form.recurrence,
    instructorLeaveError,
  });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    // The on-leave check is not known until the start date's leaves have loaded.
    if (leavesLoading) { return; }
    setError('');
    setRejectedEmails([]);
    setConflictData(null);
    if (descriptionOnly) {
      await saveDescription();
      return;
    }
    const message = validationError();
    if (message) {
      showError(message);
      return;
    }
    if (session && isPastSession) {
      await saveCorrection(session);
      return;
    }
    await saveSchedule();
  };

  const handleProceedAnyway = async () => {
    setConflictData(null);
    const acknowledgedPayload = { ...pendingPayload, acknowledge: true };
    try {
      finishSave(await saveSession(acknowledgedPayload));
    } catch (err) {
      const saveError = err as SaveError;
      if (saveError.response?.status === HTTP_CONFLICT) { setPendingPayload(acknowledgedPayload); }
      handleSaveError(saveError);
    }
  };

  const dismissError = () => {
    setError('');
    setRejectedEmails([]);
  };

  const handleClose = () => {
    dismissError();
    setConflictData(null);
    onClose();
  };

  const saveLabels = getSaveLabels(session, isPastSession);
  const dateTimeRequired = !isPastSession && !descriptionOnly;
  const dateTimeReadonly = isPastSession || descriptionOnly;

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle(session, isPastSession, descriptionOnly)}
      isBlocking={isSaving}
      hasCloseButton={!isSaving}
      isFullscreenOnMobile
      isOverflowVisible={false}
      footerNode={(
        <>
          <Button variant="tertiary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving || leavesLoading} className="ml-2">
            {isSaving ? (
              <>
                <Spinner animation="border" size="sm" className="mr-2" />
                {saveLabels.saving}
              </>
            ) : saveLabels.save}
          </Button>
        </>
      )}
    >
      {/* A disabled fieldset locks every field while the save runs. */}
      <fieldset disabled={isSaving}>
        {error && (
          <Alert variant="danger" dismissible onClose={dismissError} ref={errorRef}>
            {error}
            {rejectedEmails.length > 0 && (
              <ul className="mt-2 mb-0 pl-4">
                {rejectedEmails.map((email) => <li key={email}>{email}</li>)}
              </ul>
            )}
          </Alert>
        )}

        <ConflictAlerts
          conflict={conflictData}
          locationOptions={locationOptions}
          isSaving={isSaving}
          onProceed={handleProceedAnyway}
          onDismiss={() => setConflictData(null)}
          alertRef={conflictRef}
        />

        <Form onSubmit={handleSubmit}>
          {isPastSession && (
            <Alert variant="info" className="mb-3">
              This session has already taken place. Only the <strong>course</strong>,
              {' '}<strong>instructors</strong>, and <strong>location</strong> can be corrected.
            </Alert>
          )}

          {descriptionOnly && (
            <Alert variant="info" className="mb-3">
              You can only edit the <strong>description</strong> of this session.
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Title {!isPastSession && '*'}</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ title: e.target.value })}
              required={!isPastSession}
              placeholder="e.g., Week 5 Live Session"
              disabled={isPastSession || descriptionOnly}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Session Type *</Form.Label>
            <OverlayTrigger
              placement="top"
              overlay={session ? (
                <Tooltip id="session-type-locked-tip">
                  Session type cannot be changed after creation
                </Tooltip>
              ) : <span />}
            >
              <span className="d-block">
                <Form.Control
                  as="select"
                  value={form.sessionType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateForm({ sessionType: e.target.value })}
                  disabled={!!session || isPastSession || descriptionOnly}
                  className={classNames({ 'fbr-schedule-meeting__type-select--locked': session })}
                >
                  {sessionTypeOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Form.Control>
              </span>
            </OverlayTrigger>
          </Form.Group>

          <SessionPickers
            courseRunOptions={courseRunOptions}
            courseRunsLoading={courseRunsLoading}
            selectedCourseRun={selectedCourseRun}
            onCourseRunChange={setSelectedCourseRun}
            instructorOptions={instructorOptions}
            instructorsLoading={instructorsLoading}
            selectedInstructors={selectedInstructors}
            onInstructorsChange={setSelectedInstructors}
            instructorLeaveError={instructorLeaveError}
            locationOptions={locationOptions}
            locationsLoading={locationsLoading}
            selectedLocation={form.location}
            onLocationChange={(location) => updateForm({ location })}
            programInfo={programInfo}
            isPastSession={isPastSession}
            isSessionType={isSessionType}
            descriptionOnly={descriptionOnly}
            invalidInstructors={!!fieldErrors.instructors}
            invalidLocation={!!fieldErrors.location}
          />

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateForm({ description: e.target.value })}
              placeholder="Add session details..."
              disabled={isPastSession}
            />
          </Form.Group>

          <DateTimeGroup
            name="Start"
            date={form.startDate}
            time={form.startTime}
            onDateChange={(startDate) => updateForm({ startDate })}
            onTimeChange={(startTime) => updateForm({ startTime })}
            required={dateTimeRequired}
            readonly={dateTimeReadonly}
            showRequiredMark={!isPastSession}
            isDateInvalid={!!(fieldErrors.startDate || fieldErrors.startTime)}
            isTimeInvalid={!!fieldErrors.startTime}
          />

          {schedulingWarning && (
            <Alert variant="warning" className="mb-3 py-2 fbr-schedule-meeting__warning">
              {schedulingWarning}
            </Alert>
          )}

          <DateTimeGroup
            name="End"
            date={form.endDate}
            time={form.endTime}
            onDateChange={(endDate) => updateForm({ endDate })}
            onTimeChange={(endTime) => updateForm({ endTime })}
            required={dateTimeRequired}
            readonly={dateTimeReadonly}
            showRequiredMark={!isPastSession}
            isDateInvalid={!!fieldErrors.endTime}
            isTimeInvalid={!!fieldErrors.endTime}
          />

          <Form.Group className="mb-2">
            <Form.Checkbox
              id="create-zoom-meeting-toggle"
              name="create_zoom_meeting"
              checked={form.createZoomMeeting}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ createZoomMeeting: e.target.checked })}
              disabled={isPastSession || descriptionOnly || Boolean(session?.create_zoom_meeting)}
            >
              Create Zoom meeting for this session
            </Form.Checkbox>
            <ZoomHelpText session={session} />
          </Form.Group>

          <Form.Group className="mb-0">
            <Form.Checkbox
              id="recurring-meeting-toggle"
              name="is_recurring"
              checked={form.isRecurring}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ isRecurring: e.target.checked })}
              disabled={isPastSession || descriptionOnly || Boolean(session)}
            >
              Recurring meeting
            </Form.Checkbox>
          </Form.Group>

          {form.isRecurring && (
            <RecurrenceFields
              recurrence={form.recurrence}
              onChange={updateRecurrence}
              scheduledStart={scheduledStart}
              disabled={isPastSession}
            />
          )}
        </Form>
      </fieldset>
    </StandardModal>
  );
};

export default ScheduleMeetingModal;
