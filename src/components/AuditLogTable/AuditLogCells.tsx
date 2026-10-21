import React from 'react';
import { Badge, Button } from '@openedx/paragon';
import { Difference, History } from '@openedx/paragon/icons';
import { UserIdentity } from '../UserIdentity';
import { toRoleBadges } from '../../utils/roleLabels';
import { getActionLabel, getActionVariant, getRecordTypeLabel } from './labels';
import {
  countChangedFields, fieldsChangedLabel, formatAuditTimestamp,
} from './utils';
import { AuditLogEntry, AuditLogRow } from './types';

const MAX_LISTED_FIELDS = 3;

export const ActorIdentity = ({ entry }: { entry: AuditLogEntry }) => {
  if (!entry.actor_name) {
    return <span className="text-muted">System</span>;
  }
  return <UserIdentity name={entry.actor_name} badges={toRoleBadges(entry.actor_role)} size="compact" />;
};

export const ActionBadge = ({ action, label }: { action: string; label: string }) => (
  <Badge variant={getActionVariant(action)}>{label}</Badge>
);

interface FieldsChangedButtonProps {
  entry: AuditLogEntry;
  onClick: (entry: AuditLogEntry) => void;
  ariaLabel?: string;
}

export const FieldsChangedButton = ({ entry, onClick, ariaLabel }: FieldsChangedButtonProps) => (
  <Button
    variant="outline-primary"
    size="sm"
    onClick={() => onClick(entry)}
    className="audit-log__changes-btn"
    iconBefore={Difference}
    aria-label={ariaLabel}
  >
    {fieldsChangedLabel(countChangedFields(entry))}
  </Button>
);

export const TimestampCell = ({ entry }: { entry: AuditLogEntry }) => (
  <span className="audit-log__timestamp">{formatAuditTimestamp(entry.timestamp)}</span>
);

interface BatchToggleProps {
  row: AuditLogRow;
  isExpanded: boolean;
  onToggle: (batchId: string) => void;
}

const BatchToggle = ({ row, isExpanded, onToggle }: BatchToggleProps) => (
  <Button variant="link" size="sm" onClick={() => onToggle(row.batchId ?? '')} className="audit-log__batch-toggle">
    <Badge variant="light">{row.batchCount} entries</Badge>
    {' '}{isExpanded ? '▲' : '▼'}
  </Button>
);

interface ActionCellProps {
  row: AuditLogRow;
  expandedBatches: Set<string>;
  onToggleBatch: (batchId: string) => void;
}

export const ActionCell = ({ row, expandedBatches, onToggleBatch }: ActionCellProps) => {
  if (row.rowType === 'batch') {
    return <BatchToggle row={row} isExpanded={expandedBatches.has(row.batchId ?? '')} onToggle={onToggleBatch} />;
  }
  return <ActionBadge action={row.action} label={getActionLabel(row.action, row.record_type, row.changes)} />;
};

export const RecordTypeCell = ({ entry }: { entry: AuditLogEntry }) => (
  <span className="audit-log__record-type">{getRecordTypeLabel(entry.record_type)}</span>
);

interface RecordCellProps {
  row: AuditLogRow;
  onShowHistory: (entry: AuditLogEntry) => void;
}

const BatchSummary = ({ row }: { row: AuditLogRow }) => (
  <div className="audit-log__record">
    <div className="audit-log__record-repr audit-log__batch-summary">
      {row.batchCount} records created together
    </div>
  </div>
);

export const RecordCell = ({ row, onShowHistory }: RecordCellProps) => {
  if (row.rowType === 'batch') {
    return <BatchSummary row={row} />;
  }
  const isChild = row.rowType === 'batch-child';
  return (
    <div className={`audit-log__record${isChild ? ' audit-log__record--child' : ''}`}>
      <div className="audit-log__record-repr">{isChild ? '↳ ' : ''}{row.object_repr || '—'}</div>
      <div className="audit-log__record-meta">
        {row.object_pk && (
          <span className="audit-log__record-id">ID: {row.object_pk}</span>
        )}
        {!isChild && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onShowHistory(row)}
            className="audit-log__history-btn"
            iconBefore={History}
            aria-label={`Full history for ${row.object_repr || `record ${row.object_pk}`}`}
          >
            Full history
          </Button>
        )}
      </div>
    </div>
  );
};

interface ChangesCellProps {
  entry: AuditLogEntry;
  onShowChanges: (entry: AuditLogEntry) => void;
}

export const ChangesCell = ({ entry, onShowChanges }: ChangesCellProps) => {
  const fieldCount = countChangedFields(entry);
  if (fieldCount === 0) {
    return <span className="text-muted audit-log__record-type">—</span>;
  }
  const fieldNames = Object.keys(entry.changes ?? {});
  return (
    <div className="audit-log__changes">
      <FieldsChangedButton
        entry={entry}
        onClick={onShowChanges}
        ariaLabel={`${fieldsChangedLabel(fieldCount)}, view details for ${entry.object_repr || 'this record'}`}
      />
      <span className="audit-log__changes-fields">
        {fieldNames.slice(0, MAX_LISTED_FIELDS).join(', ')}
        {fieldCount > MAX_LISTED_FIELDS ? ` +${fieldCount - MAX_LISTED_FIELDS} more` : ''}
      </span>
    </div>
  );
};
