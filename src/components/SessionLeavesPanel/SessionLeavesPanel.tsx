import React, { useMemo, useState } from 'react';
import {
  Alert, Button, Col, DataTable, Form, Row, Spinner, StandardModal,
} from '@openedx/paragon';
import { useSessionApprovedLeaves } from '../../data/sessions/hooks';
import { SessionApprovedLeave, StudentOnLeave } from '../../data/sessions/types';
import { extractApiError } from '../../utils/format';
import { formatDateTime } from '../../utils/dates';
import { SectionHeading } from '../SectionHeading';
import { MobileRowCard, MobileRowCardsList, MobileRowField } from '../MobileRowCards';
import useIsBelowLg from '../../hooks/useIsBelowLg';
import { SessionLeavesPanelProps } from './types';
import './session-leaves-panel.scss';

const PAGE_SIZE = 15;
const LOAD_ERROR_MESSAGE = 'Failed to load sessions';
const EMPTY_VALUE = '—';

type SelectSession = (session: SessionApprovedLeave) => void;

interface ValueCellProps {
  value?: string;
}

interface RowCellProps {
  row: { original: SessionApprovedLeave };
}

const countLeaves = (session: SessionApprovedLeave) => session.students_on_leave?.length ?? 0;

const formatLeavePeriod = (student: StudentOnLeave) => (
  student.leave_start_date === student.leave_end_date
    ? student.leave_start_date
    : `${student.leave_start_date} – ${student.leave_end_date}`
);

const LeaveCount = ({ session }: { session: SessionApprovedLeave }) => {
  const n = countLeaves(session);
  return (
    <span className={`font-weight-bold fbr-session-leaves-panel__leave-count--${n > 0 ? 'some' : 'none'}`}>
      {n}
    </span>
  );
};

const ViewLeavesButton = ({ session, onSelect }: { session: SessionApprovedLeave, onSelect: SelectSession }) => (
  <Button
    size="sm"
    variant="outline-primary"
    onClick={() => onSelect(session)}
    disabled={countLeaves(session) === 0}
  >
    View approved leaves
  </Button>
);

/* eslint-disable react/no-unstable-nested-components */
const buildColumns = (onSelect: SelectSession) => [
  {
    Header: 'Session',
    accessor: 'title',
    Cell: ({ value }: ValueCellProps) => <span className="text-nowrap">{value}</span>,
  },
  {
    Header: 'Date & Time',
    accessor: 'scheduled_start_time',
    Cell: ({ value }: ValueCellProps) => <span className="text-nowrap">{value ? formatDateTime(value) : EMPTY_VALUE}</span>,
  },
  {
    Header: 'Approved Leaves',
    id: 'leaveCount',
    Cell: ({ row }: RowCellProps) => <LeaveCount session={row.original} />,
  },
  {
    Header: 'Actions',
    id: 'actions',
    Cell: ({ row }: RowCellProps) => <ViewLeavesButton session={row.original} onSelect={onSelect} />,
  },
];
/* eslint-enable react/no-unstable-nested-components */

const SessionCards = ({ sessions, onSelect }: { sessions: SessionApprovedLeave[], onSelect: SelectSession }) => (
  <MobileRowCardsList>
    {sessions.map((s) => (
      <MobileRowCard
        key={s.id ?? `${s.title}-${s.scheduled_start_time}`}
        title={s.title}
        subtitle={s.scheduled_start_time ? formatDateTime(s.scheduled_start_time) : null}
        footer={<ViewLeavesButton session={s} onSelect={onSelect} />}
      >
        <MobileRowField label="Approved leaves">
          <LeaveCount session={s} />
        </MobileRowField>
      </MobileRowCard>
    ))}
  </MobileRowCardsList>
);

const ApprovedLeavesModal = ({ session, onClose }: { session: SessionApprovedLeave, onClose: () => void }) => (
  <StandardModal
    isOpen
    onClose={onClose}
    title={`Approved Leaves — ${session.title}`}
    hasCloseButton
    isFullscreenOnMobile
    size="lg"
    footerNode={(
      <Button onClick={onClose}>Close</Button>
    )}
  >
    {countLeaves(session) === 0 ? (
      <p className="text-muted">No approved leaves for this session.</p>
    ) : (
      <ul className="fbr-session-leaves-panel__leave-list">
        {(session.students_on_leave ?? []).map((student) => (
          <li key={student.leave_request_id ?? student.user_id} className="fbr-session-leaves-panel__leave-item">
            <span className="font-weight-bold">
              {student.username || student.email}
            </span>
            <small className="text-muted ml-2">{student.email}</small>
            <small className="text-muted ml-2">{formatLeavePeriod(student)}</small>
          </li>
        ))}
      </ul>
    )}
  </StandardModal>
);

const SessionSearch = ({ value, onChange }: { value: string, onChange: (q: string) => void }) => (
  <Row className="align-items-end">
    <Col xs={12} sm={6} lg={4} className="mb-2">
      <Form.Label htmlFor="session-leaves-search" className="fbr-session-leaves-panel__search-label">
        Search sessions
      </Form.Label>
      <Form.Control
        id="session-leaves-search"
        type="text"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Search sessions..."
      />
    </Col>
    {value && (
      <Col xs="auto" className="mb-2">
        <Button variant="tertiary" size="sm" onClick={() => onChange('')}>
          Clear
        </Button>
      </Col>
    )}
  </Row>
);

const LoadingStatus = () => (
  <div className="fbr-session-leaves-panel__inline-status py-3">
    <Spinner animation="border" size="sm" />
    <small className="text-muted">Loading sessions…</small>
  </div>
);

const SessionLeavesPanel = ({ programKey }: SessionLeavesPanelProps) => {
  const isBelowLg = useIsBelowLg();
  const [pageIndex, setPageIndex] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionApprovedLeave | null>(null);
  const {
    data, error, isError, isPending,
  } = useSessionApprovedLeaves({
    program_key: programKey,
    page: pageIndex + 1,
    page_size: PAGE_SIZE,
    ...(searchQ ? { q: searchQ } : {}),
  });
  const sessions = data?.results ?? [];
  const count = data?.count ?? 0;
  const columns = useMemo(() => buildColumns(setSelectedSession), []);

  // A new search starts again from the first page.
  const changeSearch = (q: string) => {
    setSearchQ(q);
    setPageIndex(0);
  };

  return (
    <div>
      <SectionHeading>Sessions &amp; Approved Leaves</SectionHeading>
      <SessionSearch value={searchQ} onChange={changeSearch} />

      {isError && <Alert variant="danger">{extractApiError(error, LOAD_ERROR_MESSAGE)}</Alert>}

      {isPending ? <LoadingStatus /> : (
        !isError && (
          <DataTable
            key={searchQ}
            isPaginated
            manualPagination
            fetchData={({ pageIndex: nextIndex = 0 }: { pageIndex?: number }) => setPageIndex(nextIndex)}
            pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
            itemCount={count}
            data={sessions}
            columns={columns}
            initialState={{ pageIndex, pageSize: PAGE_SIZE }}
          >
            {!isBelowLg && (
              <div className="sticky-header-table sessions-table-scroll">
                <DataTable.Table />
                <DataTable.EmptyTable content="No sessions found" />
              </div>
            )}
            {isBelowLg && sessions.length > 0 && <SessionCards sessions={sessions} onSelect={setSelectedSession} />}
            <DataTable.TableFooter />
          </DataTable>
        )
      )}

      {selectedSession && (
        <ApprovedLeavesModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
};

export default SessionLeavesPanel;
