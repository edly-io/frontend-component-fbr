import React, { ReactNode, useState } from 'react';
import classNames from 'classnames';
import { Button, Spinner, StandardModal } from '@openedx/paragon';
import { REQUEST_TYPE } from '../../utils/constants';
import { useSessions } from '../../data/sessions/hooks';
import {
  LeaveOrRemoteRequest, RequestDetailCellProps, RequestSession, RequestSummaryProps,
} from './types';
import './RequestDetailCell.scss';

type LeaveMode = 'full_day' | 'session_specific';

const FULL_DAY_MODE: LeaveMode = 'full_day';
const SESSION_SPECIFIC_MODE: LeaveMode = 'session_specific';
// leave_type was previously computed as "full"; now stored as "full_day" from submitted value.
const FULL_DAY_LEAVE_TYPES = ['full', 'full_day'];
const DATE_RANGE_SEPARATOR = ' – ';

const CATEGORY_LABELS: Record<string, string> = {
  CASUAL: 'Casual',
  MED: 'Medical',
  EMER: 'Emergency',
};

const CATEGORY_MODIFIERS: Record<string, string> = {
  CASUAL: 'fbr-request-badge--casual',
  MED: 'fbr-request-badge--med',
  EMER: 'fbr-request-badge--emer',
};

const formatDate = (val?: string): string | null => {
  if (!val) { return null; }
  // Handle both date-only (YYYY-MM-DD) and full ISO strings safely.
  const d = val.includes('T') ? new Date(val) : new Date(`${val}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const joinRange = (start: string | null, end: string | null): string | null => {
  if (start === end) { return start; }
  if (start && end) { return `${start}${DATE_RANGE_SEPARATOR}${end}`; }
  return start || end;
};

const deriveDateRange = (sessions: RequestSession[]): string | null => {
  const times = sessions.map((s) => s.scheduled_start_time).filter(Boolean).sort() as string[];
  if (!times.length) { return null; }
  return joinRange(formatDate(times[0]), formatDate(times[times.length - 1]));
};

const isLeaveRequest = (req: LeaveOrRemoteRequest) => req.request_type_label === REQUEST_TYPE.LEAVE;

const isFullDayLeave = (req: LeaveOrRemoteRequest) => (
  isLeaveRequest(req) && FULL_DAY_LEAVE_TYPES.includes(req.leave_type ?? '')
);

const getLeaveMode = (req: LeaveOrRemoteRequest): LeaveMode | null => {
  if (!isLeaveRequest(req)) { return null; }
  return isFullDayLeave(req) ? FULL_DAY_MODE : SESSION_SPECIFIC_MODE;
};

const getDateRange = (req: LeaveOrRemoteRequest): string | null => {
  if (isFullDayLeave(req)) {
    return joinRange(formatDate(req.leave_start_date), formatDate(req.leave_end_date));
  }
  return isLeaveRequest(req) ? deriveDateRange(req.sessions || []) : null;
};

const getModalTitle = (req: LeaveOrRemoteRequest): string => {
  if (isLeaveRequest(req)) { return 'Leave details'; }
  if (req.request_type_label === REQUEST_TYPE.REMOTE_SESSION) { return 'Remote session details'; }
  return 'Request details';
};

const CategoryBadge = ({ category }: { category?: string }) => {
  if (!category) { return null; }
  const modifier = CATEGORY_MODIFIERS[category] || CATEGORY_MODIFIERS.CASUAL;
  return (
    <span className={classNames('fbr-request-badge', 'fbr-request-badge--category', modifier)}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
};

const ModeBadge = ({ mode }: { mode: LeaveMode | null }) => {
  if (!mode) { return null; }
  const isFullDay = mode === FULL_DAY_MODE;
  return (
    <span
      className={classNames(
        'fbr-request-badge',
        isFullDay ? 'fbr-request-badge--full-day' : 'fbr-request-badge--session-specific',
      )}
    >
      {isFullDay ? 'Full Day' : 'Session-specific'}
    </span>
  );
};

const SessionList = ({ sessions }: { sessions: RequestSession[] }) => (
  <ul className="list-unstyled mb-0">
    {sessions.map((s) => (
      <li key={s.id} className="py-1">
        {formatDate(s.scheduled_start_time)} · {s.title}
      </li>
    ))}
  </ul>
);

const NoSessions = ({ children }: { children: ReactNode }) => <span className="text-muted">{children}</span>;

const SessionsLabel = ({ total = 0 }: { total?: number }) => (
  <div className="small text-muted">{total > 0 ? `Sessions (${total})` : 'Sessions'}</div>
);

interface ShowMoreSessionsProps {
  remaining: number;
  isLoading: boolean;
  onClick: () => void;
}

const ShowMoreSessions = ({ remaining, isLoading, onClick }: ShowMoreSessionsProps) => (
  <Button variant="link" size="sm" className="p-0" onClick={onClick} disabled={isLoading}>
    {isLoading
      ? <Spinner animation="border" size="sm" screenReaderText="Loading more sessions" />
      : `Show more (${remaining} remaining)`}
  </Button>
);

/**
 * Sessions in a full-day leave period, looked up from the program's schedule a page
 * at a time, with the total and a "Show more" for the rest.
 */
const FullDaySessions = ({ req, programKey }: RequestSummaryProps) => {
  const lookupEnabled = Boolean(programKey && req.leave_start_date && req.leave_end_date);
  const {
    data, isLoading, isFetched, hasNextPage, fetchNextPage, isFetchingNextPage,
  } = useSessions({
    program_key: programKey,
    start_date: req.leave_start_date,
    end_date: req.leave_end_date,
  }, lookupEnabled);

  const periodSessions = data?.pages.flatMap((page) => page.results) ?? [];
  const hasPeriodSessions = periodSessions.length > 0;
  const display = hasPeriodSessions ? periodSessions : (req.sessions || []);
  const total = hasPeriodSessions ? (data?.pages[0].count ?? 0) : display.length;
  const showEmpty = isFetched || !programKey;

  let body: ReactNode = null;
  if (isLoading) {
    body = <Spinner animation="border" size="sm" screenReaderText="Loading sessions" />;
  } else if (display.length > 0) {
    body = <SessionList sessions={display} />;
  } else if (showEmpty) {
    body = <NoSessions>No sessions scheduled in this period</NoSessions>;
  }
  return (
    <>
      <SessionsLabel total={isLoading ? 0 : total} />
      {body}
      {hasNextPage && (
        <ShowMoreSessions
          remaining={total - display.length}
          isLoading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        />
      )}
    </>
  );
};

const LinkedSessions = ({ sessions }: { sessions: RequestSession[] }) => (
  <>
    <SessionsLabel />
    {sessions.length > 0 ? <SessionList sessions={sessions} /> : <NoSessions>No sessions</NoSessions>}
  </>
);

// Badges, date and sessions for one request. Shared by the Details modal and the
// learner's delete / withdraw confirmation.
export const RequestSummary = ({ req, programKey = '' }: RequestSummaryProps) => {
  const isFullDay = isFullDayLeave(req);
  const dateRange = getDateRange(req);
  return (
    <>
      {isLeaveRequest(req) && (
        <div className="mb-3">
          <ModeBadge mode={getLeaveMode(req)} />
          <CategoryBadge category={req.category} />
        </div>
      )}
      {dateRange && (
        <div className="mb-3">
          <div className="small text-muted">{isFullDay ? 'Leave period' : 'Date'}</div>
          <div className="font-weight-bold">{dateRange}</div>
        </div>
      )}
      {isFullDay
        ? <FullDaySessions req={req} programKey={programKey} />
        : <LinkedSessions sessions={req.sessions || []} />}
    </>
  );
};

const RequestDetailCell = ({ req, programKey = '' }: RequestDetailCellProps) => {
  const [expanded, setExpanded] = useState(false);
  const isLeave = isLeaveRequest(req);
  const close = () => setExpanded(false);

  return (
    <div>
      {isLeave && <ModeBadge mode={getLeaveMode(req)} />}
      {isLeave && <CategoryBadge category={req.category} />}
      <Button
        variant="link"
        size="sm"
        className="d-block p-0 text-left"
        onClick={() => setExpanded(true)}
      >
        Details
      </Button>
      <StandardModal
        isOpen={expanded}
        onClose={close}
        title={getModalTitle(req)}
        size="md"
        isFullscreenOnMobile
        footerNode={(
          <Button variant="tertiary" onClick={close}>Close</Button>
        )}
      >
        {expanded && <RequestSummary req={req} programKey={programKey} />}
      </StandardModal>
    </div>
  );
};

export default RequestDetailCell;
