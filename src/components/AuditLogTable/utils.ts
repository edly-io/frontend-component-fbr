import { ApiRecord } from '../../data/types';
import { AuditLogEntry, AuditLogRow } from './types';

export const PAGE_SIZE = 20;

const TIMESTAMP_LOCALE = 'en-GB';
const TIMESTAMP_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
};

export const formatAuditTimestamp = (timestamp: string): string => (
  new Date(timestamp).toLocaleString(TIMESTAMP_LOCALE, TIMESTAMP_FORMAT)
);

// The data layer types audit-log rows loosely (ApiRecord); this table reads them as entries.
export const toAuditLogEntries = (results: ApiRecord[] = []): AuditLogEntry[] => (
  results as unknown as AuditLogEntry[]
);

export const countChangedFields = (entry: AuditLogEntry): number => (
  entry.changes ? Object.keys(entry.changes).length : 0
);

export const fieldsChangedLabel = (fieldCount: number): string => (
  `${fieldCount} field${fieldCount !== 1 ? 's' : ''} changed`
);

/** Index just past the run of entries starting at `start` that share `batchId`. */
const findBatchEnd = (logs: AuditLogEntry[], start: number, batchId: string): number => {
  let end = start + 1;
  while (end < logs.length && logs[end].additional_data?.batch_id === batchId) {
    end += 1;
  }
  return end;
};

const buildBatchRows = (
  batchEntries: AuditLogEntry[],
  batchId: string,
  isExpanded: boolean,
): AuditLogRow[] => {
  const summary: AuditLogRow = {
    ...batchEntries[0],
    id: `batch-${batchId}`,
    rowType: 'batch',
    batchId,
    batchCount: batchEntries.length,
    batchEntries,
    action: 'batch',
  };
  if (!isExpanded) { return [summary]; }
  return [summary, ...batchEntries.map((entry): AuditLogRow => ({ ...entry, rowType: 'batch-child', batchId }))];
};

/** Groups consecutive entries sharing the same batch_id into collapsible batch rows. */
export const groupLogs = (logs: AuditLogEntry[], expandedBatches: Set<string>): AuditLogRow[] => {
  const rows: AuditLogRow[] = [];
  let i = 0;
  while (i < logs.length) {
    const entry = logs[i];
    const batchId = entry.additional_data?.batch_id;
    const end = batchId ? findBatchEnd(logs, i, batchId) : i + 1;
    if (batchId && end - i > 1) {
      rows.push(...buildBatchRows(logs.slice(i, end), batchId, expandedBatches.has(batchId)));
    } else {
      rows.push({ ...entry, rowType: 'entry' });
    }
    i = end;
  }
  return rows;
};
