export interface AuditLogTableProps {
  /** Django app label of the audited models, e.g. `fbr_programs` or `attendance`. */
  appLabel: string;
  /** Model names to show. With a single model (or a known set), the action filter uses domain labels. */
  models?: string[];
  /** Pins the table to one record and hides the "Record Type" column. */
  objectId?: string | number;
  programKey?: string;
  courseKey?: string;
  /** Narrows the table to one record and shows a banner with a way back (see `onClearFilter`). */
  recordFilter?: string | number;
  onClearFilter?: () => void;
}

/** `[oldValue, newValue]` per changed field. */
export type AuditLogChanges = Record<string, [unknown, unknown]>;

export interface AuditLogEntry {
  id: string | number;
  timestamp: string;
  actor_name?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  record_type?: string;
  object_repr?: string;
  object_pk?: string | number;
  changes?: AuditLogChanges | null;
  additional_data?: { batch_id?: string } | null;
}

export type AuditLogRowType = 'entry' | 'batch' | 'batch-child';

export interface AuditLogRow extends AuditLogEntry {
  rowType: AuditLogRowType;
  batchId?: string;
  batchCount?: number;
  batchEntries?: AuditLogEntry[];
}

export interface FilterOption {
  value: string;
  label: string;
}
