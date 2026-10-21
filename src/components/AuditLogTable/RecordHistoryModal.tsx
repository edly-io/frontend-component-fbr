import React, { useState } from 'react';
import {
  ActionRow, Alert, Button, DataTable, ModalDialog, Pagination, Spinner,
} from '@openedx/paragon';
import { useRecordHistory } from '../../data/auditLogs/hooks';
import { getActionLabel } from './labels';
import { ActionBadge, ActorIdentity, FieldsChangedButton } from './AuditLogCells';
import ChangesModal from './ChangesModal';
import {
  countChangedFields, formatAuditTimestamp, PAGE_SIZE, toAuditLogEntries,
} from './utils';
import { AuditLogEntry } from './types';

const HISTORY_ERROR_FALLBACK = 'Failed to load history.';

interface RowCellProps {
  row: { original: AuditLogEntry };
}

const buildHistoryColumns = (recordType: string | undefined, onShowChanges: (entry: AuditLogEntry) => void) => [
  {
    Header: 'Timestamp',
    id: 'timestamp',
    Cell: ({ row }: RowCellProps) => formatAuditTimestamp(row.original.timestamp),
  },
  {
    Header: 'Actor',
    id: 'actor',
    Cell: ({ row }: RowCellProps) => <ActorIdentity entry={row.original} />,
  },
  {
    Header: 'Action',
    id: 'action',
    // Labelled by the model only (no diff), as Studio does today.
    Cell: ({ row }: RowCellProps) => (
      <ActionBadge action={row.original.action} label={getActionLabel(row.original.action, recordType)} />
    ),
  },
  {
    Header: 'Fields changed',
    id: 'fields',
    Cell: ({ row }: RowCellProps) => (countChangedFields(row.original) === 0
      ? '—'
      : <FieldsChangedButton entry={row.original} onClick={onShowChanges} />),
  },
];

interface RecordHistoryModalProps {
  appLabel: string;
  recordType?: string;
  objectId: string;
  objectRepr: string;
  onClose: () => void;
}

const RecordHistoryModal = ({
  appLabel, recordType, objectId, objectRepr, onClose,
}: RecordHistoryModalProps) => {
  const [page, setPage] = useState(1);
  const [changesEntry, setChangesEntry] = useState<AuditLogEntry | null>(null);

  const { data, isPending, error } = useRecordHistory({
    appLabel,
    models: recordType ? [recordType] : [],
    objectId,
    page,
    pageSize: PAGE_SIZE,
  });

  const logs = toAuditLogEntries(data?.results);
  const count = data?.count ?? 0;
  const pageCount = Math.ceil(count / PAGE_SIZE);
  const errorMessage = error ? ((error as Error).message || HISTORY_ERROR_FALLBACK) : '';

  return (
    <ModalDialog
      isOpen
      onClose={onClose}
      title="Full History"
      size="lg"
      hasCloseButton
      isFullscreenOnMobile
      // Paragon's types require this prop; false is its runtime default.
      isOverflowVisible={false}
      className="audit-modal"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>Full History</ModalDialog.Title>
        <small className="audit-modal__subtitle">{objectRepr}</small>
      </ModalDialog.Header>

      <ModalDialog.Body>
        {isPending && (
          <div className="text-center py-4">
            <Spinner animation="border" screenReaderText="Loading history" />
          </div>
        )}
        {!isPending && errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {!isPending && !errorMessage && (
          <>
            <div className="audit-log__table-scroll audit-log__table-scroll--narrow">
              <DataTable data={logs} itemCount={count} columns={buildHistoryColumns(recordType, setChangesEntry)}>
                <DataTable.Table />
                <DataTable.EmptyTable content="No history recorded yet." />
              </DataTable>
            </div>
            {pageCount > 1 && (
              <Pagination
                paginationLabel="History pagination"
                pageCount={pageCount}
                currentPage={page}
                onPageSelect={setPage}
                size="small"
                className="mt-3"
              />
            )}
          </>
        )}
      </ModalDialog.Body>

      <ModalDialog.Footer>
        <ActionRow>
          <Button variant="outline-primary" onClick={onClose}>Close</Button>
        </ActionRow>
      </ModalDialog.Footer>

      {changesEntry && <ChangesModal entry={changesEntry} onClose={() => setChangesEntry(null)} />}
    </ModalDialog>
  );
};

export default RecordHistoryModal;
