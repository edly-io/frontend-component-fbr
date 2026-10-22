import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Button, ButtonGroup, Container, Spinner, Toast,
} from '@openedx/paragon';
import { AuditLogTable } from '../AuditLogTable';
import { useCancelSession, useDeleteSession } from '../../data/sessions/hooks';
import useModalParams from '../../hooks/useModalParams';
import { ApiErrorLike, extractApiError } from '../../utils/format';
import CalendarView from './CalendarView';
import { ProgramCalendarProvider } from './ProgramCalendarContext';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import SessionConfirmModal from './SessionConfirmModal';
import SessionDetailModal from './SessionDetailModal';
import useActiveModalSession from './useActiveModalSession';
import useCalendarNavigation from './useCalendarNavigation';
import useProgramCalendarData from './useProgramCalendarData';
import {
  CalendarSession, ProgramCalendarProps, ScheduleSession, SessionActionHandlers,
} from './types';
import './calendar.scss';

const CALENDAR_TAB = 'calendar';
const AUDIT_LOG_TAB = 'audit-log';
const AUDIT_MODELS = ['session', 'sessioninstructor'];
const TOAST_DELAY_MS = 4000;

const MODAL = {
  DETAIL: 'session',
  NEW: 'new-session',
  EDIT: 'edit-session',
  DELETE: 'delete-session',
  CANCEL: 'cancel-session',
};

/** `?view=calendar|audit-log` and the audit log's `?record_id=` filter. */
const useCalendarTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const changeTab = (tab: string) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.set('view', tab);
    if (tab !== AUDIT_LOG_TAB) { next.delete('record_id'); }
    return next;
  });
  const clearRecordFilter = () => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.delete('record_id');
    return next;
  });
  return {
    activeTab: searchParams.get('view') || CALENDAR_TAB,
    recordFilter: searchParams.get('record_id') || undefined,
    changeTab,
    clearRecordFilter,
  };
};

const useSuccessToast = () => {
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const showSuccess = (text: string) => {
    setMessage(text);
    setShow(true);
  };
  return {
    message, show, showSuccess, hide: () => setShow(false),
  };
};

interface TabToggleProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const TabToggle = ({ activeTab, onChange }: TabToggleProps) => (
  <div className="d-flex justify-content-end mb-3 px-3">
    <ButtonGroup size="sm">
      {[[CALENDAR_TAB, 'Calendar'], [AUDIT_LOG_TAB, 'Audit Log']].map(([tab, label]) => (
        <Button
          key={tab}
          variant={activeTab === tab ? 'primary' : 'outline-primary'}
          size="sm"
          aria-pressed={activeTab === tab}
          onClick={() => onChange(tab)}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  </div>
);

const ProgramCalendarPage = ({ programKey }: { programKey: string }) => {
  const nav = useCalendarNavigation();
  const data = useProgramCalendarData(programKey, nav.start, nav.end);
  const { role } = data;
  const tab = useCalendarTab();
  const toast = useSuccessToast();
  const {
    modal, modalId, openModal, closeModal,
  } = useModalParams();
  const { activeModalSession, detailError } = useActiveModalSession(modal, modalId, data.sessions);
  const [deleteError, setDeleteError] = useState('');
  const [cancelError, setCancelError] = useState('');
  const deleteSession = useDeleteSession();
  const cancelSession = useCancelSession();

  const handlers: SessionActionHandlers = useMemo(() => ({
    onEdit: (session) => openModal(MODAL.EDIT, session.id),
    onDelete: (session) => { setDeleteError(''); openModal(MODAL.DELETE, session.id); },
    onCancel: (session) => { setCancelError(''); openModal(MODAL.CANCEL, session.id); },
    onSessionDetail: (session) => openModal(MODAL.DETAIL, session.id),
  }), [openModal]);

  // The schedule modal's mutations refresh the calendar themselves.
  const handleSessionSuccess = () => {
    const wasEdit = modal === MODAL.EDIT;
    closeModal();
    toast.showSuccess(wasEdit ? 'Session updated successfully!' : 'Session created successfully!');
  };

  const confirmWith = (
    mutate: (id: number) => Promise<unknown>,
    successMessage: string,
    setError: (message: string) => void,
    fallbackError: string,
  ) => async () => {
    if (!activeModalSession) { return; }
    try {
      await mutate(activeModalSession.id as number);
      closeModal();
      toast.showSuccess(successMessage);
    } catch (err) {
      setError(extractApiError(err as ApiErrorLike, fallbackError));
    }
  };
  const dismissWith = (setError: (message: string) => void) => () => {
    closeModal();
    setError('');
  };

  const isScheduleOpen = modal === MODAL.NEW || modal === MODAL.EDIT;
  const scheduleSession = modal === MODAL.NEW ? null : (activeModalSession as ScheduleSession | null);
  const showConfirm = (name: string): CalendarSession | null => (
    role.canManageSessions && modal === name ? activeModalSession : null
  );
  const deleteTarget = showConfirm(MODAL.DELETE);
  const cancelTarget = showConfirm(MODAL.CANCEL);

  const renderContent = () => {
    // Initial load — full-page spinner. Later navigations dim the grid inside
    // CalendarView instead, so it stays visible.
    if (data.loading && data.sessions.length === 0 && !data.error) {
      return (
        <Container className="py-5 text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading your sessions...</p>
        </Container>
      );
    }
    if (data.error) {
      return <Container className="py-5"><Alert variant="danger">{data.error}</Alert></Container>;
    }
    return (
      <Container className="py-4">
        {detailError && <Alert variant="danger" className="mb-3">{detailError}</Alert>}
        <CalendarView
          sessions={data.sessions}
          view={nav.view}
          currentDate={nav.currentDate}
          onViewChange={nav.handleViewChange}
          onNavigate={nav.handleNavigate}
          onGoToToday={nav.handleGoToToday}
          onScheduleNew={() => openModal(MODAL.NEW)}
          handlers={handlers}
          loading={data.loading}
          role={role}
          studentRequestMap={data.studentRequestMap}
          leaveDateMap={data.leaveDateMap}
          holidays={data.holidays}
          programDates={data.programDates}
          sessionTypeColors={data.sessionTypeColors}
          sessionTypeLabels={data.sessionTypeLabels}
          programName={data.programInfo?.name || ''}
        />
      </Container>
    );
  };

  return (
    <>
      {role.canManageSessions && <TabToggle activeTab={tab.activeTab} onChange={tab.changeTab} />}

      {role.canManageSessions && tab.activeTab === AUDIT_LOG_TAB ? (
        <div className="audit-log-view">
          <AuditLogTable
            appLabel="attendance"
            models={AUDIT_MODELS}
            programKey={programKey}
            recordFilter={tab.recordFilter}
            onClearFilter={tab.clearRecordFilter}
          />
        </div>
      ) : (
        <main id="main-content" className="d-flex flex-column flex-grow-1">{renderContent()}</main>
      )}

      {/* Schedule modal: admins get full edit; instructors get description-only edit */}
      {(role.canManageSessions || role.isInstructor) && isScheduleOpen && (
        <ScheduleMeetingModal
          isOpen
          onClose={closeModal}
          programKey={programKey}
          programInfo={data.programInfo}
          session={scheduleSession}
          onSuccess={handleSessionSuccess}
          holidays={data.holidays}
          descriptionOnly={role.isInstructor && !role.canManageSessions}
        />
      )}

      {deleteTarget && (
        <SessionConfirmModal
          title="Delete Session"
          dismissLabel="Cancel"
          confirmLabel="Delete"
          confirmVariant="danger"
          error={deleteError}
          onConfirm={confirmWith(deleteSession.mutateAsync, 'Session deleted successfully!', setDeleteError, 'Failed to delete session')}
          onDismiss={dismissWith(setDeleteError)}
        >
          Are you sure you want to delete the session <strong>{deleteTarget.title}</strong>?
          This action cannot be undone.
        </SessionConfirmModal>
      )}

      {/* Soft-cancel preserves the row + Zoom; it can be re-scheduled via PATCH status:scheduled. */}
      {cancelTarget && (
        <SessionConfirmModal
          title="Cancel Session"
          dismissLabel="Keep scheduled"
          confirmLabel="Cancel session"
          confirmVariant="warning"
          error={cancelError}
          onConfirm={confirmWith(cancelSession.mutateAsync, 'Session cancelled.', setCancelError, 'Failed to cancel session')}
          onDismiss={dismissWith(setCancelError)}
        >
          Cancel <strong>{cancelTarget.title}</strong>? Enrolled learners will see
          the session as Cancelled. The Zoom meeting (if any) is kept so you can
          reschedule.
        </SessionConfirmModal>
      )}

      {/* Session detail — read-only, for admins and learners alike. */}
      <SessionDetailModal
        session={activeModalSession}
        isOpen={modal === MODAL.DETAIL && Boolean(activeModalSession)}
        onClose={closeModal}
        canManageSessions={role.canManageSessions}
        sessionTypeLabels={data.sessionTypeLabels}
      />

      {/* Toast — persists across view transitions */}
      <div className="fbr-program-calendar__toast" aria-live="polite" aria-atomic="true">
        {/* Paragon's Toast types omit `autohide`, but it is forwarded to the
            underlying toast, as fbr-home passes it today. */}
        <Toast show={toast.show} onClose={toast.hide} delay={TOAST_DELAY_MS} {...{ autohide: true }}>
          {toast.message}
        </Toast>
      </div>
    </>
  );
};

/**
 * A program's session calendar (month/week/day), with scheduling, the session
 * detail modal and, for admins, the sessions audit log. Mount it inside the
 * host app's router: modals and tabs live in the URL (`?modal=&id=`,
 * `?view=audit-log&record_id=`), and links are built from `basePath`.
 */
const ProgramCalendar = ({ programKey, basePath }: ProgramCalendarProps) => (
  <ProgramCalendarProvider programKey={programKey} basePath={basePath}>
    <ProgramCalendarPage programKey={programKey} />
  </ProgramCalendarProvider>
);

export default ProgramCalendar;
