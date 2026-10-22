import React from 'react';
import {
  ActionRow, Badge, Button, DataTable, ModalDialog,
} from '@openedx/paragon';
import { getActionVariant } from './labels';
import { formatAuditTimestamp } from './utils';
import { AuditLogEntry } from './types';

const EMPTY_VALUE = '—';

const CHANGE_COLUMNS = [
  { Header: 'Field', accessor: 'field', cellClassName: 'audit-modal__td--field' },
  { Header: 'Old value', accessor: 'oldValue', cellClassName: 'audit-modal__td--old' },
  { Header: 'New value', accessor: 'newValue', cellClassName: 'audit-modal__td--new' },
];

const buildChangeRows = (entry: AuditLogEntry) => Object.entries(entry.changes || {})
  .map(([field, [oldVal, newVal]]) => ({
    field, oldValue: String(oldVal ?? EMPTY_VALUE), newValue: String(newVal ?? EMPTY_VALUE),
  }));

interface ChangesModalProps {
  entry: AuditLogEntry;
  onClose: () => void;
}

const ChangesSubtitle = ({ entry }: { entry: AuditLogEntry }) => (
  <small className="audit-modal__subtitle">
    {formatAuditTimestamp(entry.timestamp)}
    {' · '}
    <Badge variant={getActionVariant(entry.action)}>{entry.action}</Badge>
    {' · '}
    {entry.actor_name || 'System'}
    {entry.actor_email && ` (${entry.actor_email})`}
  </small>
);

const ChangesModal = ({ entry, onClose }: ChangesModalProps) => {
  const changeRows = buildChangeRows(entry);
  const title = `Change Details — ${entry.object_repr}`;

  return (
    <ModalDialog
      isOpen
      onClose={onClose}
      title={title}
      size="lg"
      hasCloseButton
      isFullscreenOnMobile
      // Paragon's types require this prop; false is its runtime default.
      isOverflowVisible={false}
      className="audit-modal"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
        <ChangesSubtitle entry={entry} />
      </ModalDialog.Header>

      <ModalDialog.Body>
        {changeRows.length === 0 ? (
          <p className="audit-modal__empty">No field-level diff recorded for this entry.</p>
        ) : (
          <div className="audit-log__table-scroll audit-log__table-scroll--narrow">
            <DataTable data={changeRows} itemCount={changeRows.length} columns={CHANGE_COLUMNS}>
              <DataTable.Table />
            </DataTable>
          </div>
        )}
      </ModalDialog.Body>

      <ModalDialog.Footer>
        <ActionRow>
          <Button variant="outline-primary" onClick={onClose}>Close</Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default ChangesModal;
