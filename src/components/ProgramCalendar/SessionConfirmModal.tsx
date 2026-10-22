import React from 'react';
import {
  Alert, Button, Spinner, StandardModal,
} from '@openedx/paragon';

interface SessionConfirmModalProps {
  title: string;
  dismissLabel: string;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  confirmVariant: string;
  error: string;
  onConfirm: () => void;
  onDismiss: () => void;
  children: React.ReactNode;
}

/** The admin's Delete / Cancel session confirmation. Locked while the request runs. */
const SessionConfirmModal = ({
  title, dismissLabel, confirmLabel, pendingLabel, isPending, confirmVariant, error, onConfirm, onDismiss, children,
}: SessionConfirmModalProps) => (
  <StandardModal
    isOpen
    onClose={onDismiss}
    title={title}
    isBlocking={isPending}
    hasCloseButton={!isPending}
    footerNode={(
      <>
        <Button variant="tertiary" onClick={onDismiss} disabled={isPending}>{dismissLabel}</Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={isPending} className="ml-2">
          {isPending ? (
            <>
              <Spinner animation="border" size="sm" className="mr-2" />
              {pendingLabel}
            </>
          ) : confirmLabel}
        </Button>
      </>
    )}
  >
    {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
    <p>{children}</p>
  </StandardModal>
);

export default SessionConfirmModal;
