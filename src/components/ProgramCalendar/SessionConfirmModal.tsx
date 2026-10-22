import React from 'react';
import { Alert, Button, StandardModal } from '@openedx/paragon';

interface SessionConfirmModalProps {
  title: string;
  dismissLabel: string;
  confirmLabel: string;
  confirmVariant: string;
  error: string;
  onConfirm: () => void;
  onDismiss: () => void;
  children: React.ReactNode;
}

/** The admin's Delete / Cancel session confirmation. */
const SessionConfirmModal = ({
  title, dismissLabel, confirmLabel, confirmVariant, error, onConfirm, onDismiss, children,
}: SessionConfirmModalProps) => (
  <StandardModal
    isOpen
    onClose={onDismiss}
    title={title}
    footerNode={(
      <>
        <Button variant="tertiary" onClick={onDismiss}>{dismissLabel}</Button>
        <Button variant={confirmVariant} onClick={onConfirm} className="ml-2">{confirmLabel}</Button>
      </>
    )}
  >
    {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
    <p>{children}</p>
  </StandardModal>
);

export default SessionConfirmModal;
