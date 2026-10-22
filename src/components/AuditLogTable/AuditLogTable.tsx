import React, {
  ChangeEvent, useRef, useState,
} from 'react';
import {
  Alert, DataTable, Pagination, Spinner,
} from '@openedx/paragon';
import { useAuditLogs } from '../../data/auditLogs/hooks';
import {
  ActionCell, ActorIdentity, ChangesCell, RecordCell, RecordTypeCell, TimestampCell,
} from './AuditLogCells';
import AuditLogFilters, { RecordFilterBanner } from './AuditLogFilters';
import ChangesModal from './ChangesModal';
import RecordHistoryModal from './RecordHistoryModal';
import { groupLogs, PAGE_SIZE, toAuditLogEntries } from './utils';
import { AuditLogEntry, AuditLogRow, AuditLogTableProps } from './types';
import './AuditLogTable.scss';

const SEARCH_DEBOUNCE_MS = 400;
const LOAD_ERROR_FALLBACK = 'Failed to load audit log.';

interface QueryError extends Error {
  response?: { data?: { detail?: string } };
}

const toErrorMessage = (error: QueryError | null): string => {
  if (!error) { return ''; }
  return error.response?.data?.detail || error.message || LOAD_ERROR_FALLBACK;
};

/** Search (debounced), action and date filters; every change goes back to page 1. */
const useAuditLogFilters = (onClearFilter?: () => void) => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchText(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => withPageReset(setDebouncedSearch)(value), SEARCH_DEBOUNCE_MS);
  };

  const onClearFilters = () => {
    setActionFilter('');
    setSearchText('');
    setDebouncedSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    onClearFilter?.();
  };

  return {
    page,
    setPage,
    debouncedSearch,
    hasAnyFilter: actionFilter !== '' || searchText !== '' || dateFrom !== '' || dateTo !== '',
    filterProps: {
      searchText,
      onSearchChange,
      actionFilter,
      onActionChange: (event: ChangeEvent<HTMLSelectElement>) => withPageReset(setActionFilter)(event.target.value),
      dateFrom,
      onDateFromChange: withPageReset(setDateFrom),
      dateTo,
      onDateToChange: withPageReset(setDateTo),
      onClearFilters,
    },
  };
};

interface RowCellProps {
  row: { original: AuditLogRow };
}

interface ColumnHandlers {
  isPageLevel: boolean;
  expandedBatches: Set<string>;
  onToggleBatch: (batchId: string) => void;
  onShowHistory: (entry: AuditLogEntry) => void;
  onShowChanges: (entry: AuditLogEntry) => void;
}

const buildColumns = ({
  isPageLevel, expandedBatches, onToggleBatch, onShowHistory, onShowChanges,
}: ColumnHandlers) => [
  { Header: 'Timestamp', accessor: 'timestamp', Cell: ({ row }: RowCellProps) => <TimestampCell entry={row.original} /> },
  { Header: 'Actor', accessor: 'actor_name', Cell: ({ row }: RowCellProps) => <ActorIdentity entry={row.original} /> },
  {
    Header: 'Action',
    accessor: 'action',
    Cell: ({ row }: RowCellProps) => (
      <ActionCell row={row.original} expandedBatches={expandedBatches} onToggleBatch={onToggleBatch} />
    ),
  },
  ...(isPageLevel ? [{
    Header: 'Record Type',
    accessor: 'record_type',
    Cell: ({ row }: RowCellProps) => <RecordTypeCell entry={row.original} />,
  }] : []),
  {
    Header: 'Record',
    accessor: 'object_repr',
    Cell: ({ row }: RowCellProps) => <RecordCell row={row.original} onShowHistory={onShowHistory} />,
  },
  {
    Header: 'Changes',
    accessor: 'changes',
    disableSortBy: true,
    Cell: ({ row }: RowCellProps) => <ChangesCell entry={row.original} onShowChanges={onShowChanges} />,
  },
];

const toggleInSet = (set: Set<string>, value: string): Set<string> => {
  const next = new Set(set);
  if (next.has(value)) { next.delete(value); } else { next.add(value); }
  return next;
};

const AuditLogTable = ({
  appLabel, models = [], objectId, programKey, courseKey, recordFilter, onClearFilter,
}: AuditLogTableProps) => {
  const {
    page, setPage, debouncedSearch, hasAnyFilter, filterProps,
  } = useAuditLogFilters(onClearFilter);
  const [changesEntry, setChangesEntry] = useState<AuditLogEntry | null>(null);
  const [historyEntry, setHistoryEntry] = useState<AuditLogEntry | null>(null);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const { data, isPending, error } = useAuditLogs({
    appLabel,
    models,
    objectId: objectId || recordFilter,
    action: filterProps.actionFilter || undefined,
    search: debouncedSearch || undefined,
    programKey,
    courseKey,
    dateFrom: filterProps.dateFrom || undefined,
    dateTo: filterProps.dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const displayRows = groupLogs(toAuditLogEntries(data?.results), expandedBatches);
  const count = data?.count ?? 0;
  const pageCount = Math.ceil(count / PAGE_SIZE);
  const errorMessage = toErrorMessage(error as QueryError | null);
  const columns = buildColumns({
    isPageLevel: !objectId,
    expandedBatches,
    onToggleBatch: (batchId) => setExpandedBatches((prev) => toggleInSet(prev, batchId)),
    onShowHistory: setHistoryEntry,
    onShowChanges: setChangesEntry,
  });

  return (
    <div className="audit-log">
      {recordFilter && <RecordFilterBanner recordFilter={recordFilter} onClearFilter={onClearFilter} />}

      <AuditLogFilters
        {...filterProps}
        models={models}
        count={count}
        hasActiveFilters={hasAnyFilter || !!recordFilter}
      />

      {isPending && (
        <div className="text-center py-4">
          <Spinner animation="border" screenReaderText="Loading audit log" />
        </div>
      )}
      {!isPending && errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {!isPending && !errorMessage && (
        <>
          {/* `sessions-table-scroll` keeps fbr-home's global listing rules (nowrap headers and buttons). */}
          <div className="audit-log__table-scroll">
            <DataTable className="sessions-table-scroll" isSortable data={displayRows} columns={columns} itemCount={count}>
              <DataTable.Table />
              <DataTable.EmptyTable content="No activity recorded yet." />
            </DataTable>
          </div>
          {pageCount > 1 && (
            <Pagination
              paginationLabel="Audit log pagination"
              pageCount={pageCount}
              currentPage={page}
              onPageSelect={setPage}
              size="small"
              className="mt-3"
            />
          )}
        </>
      )}

      {changesEntry && <ChangesModal entry={changesEntry} onClose={() => setChangesEntry(null)} />}
      {historyEntry && (
        <RecordHistoryModal
          appLabel={appLabel}
          recordType={historyEntry.record_type}
          objectId={String(historyEntry.object_pk)}
          objectRepr={historyEntry.object_repr || ''}
          onClose={() => setHistoryEntry(null)}
        />
      )}
    </div>
  );
};

export default AuditLogTable;
