import React from 'react';
import { Alert, Button } from '@openedx/paragon';
import { SelectOption } from '../SearchableSelect';

// The HTTP 409 body the sessions API returns for a scheduling conflict.

export interface ConflictEntity {
  type: 'instructor' | 'room' | 'session';
  full_name?: string;
  email?: string;
  conflicting_session_name?: string;
  program_name?: string;
  name?: string;
  session_title?: string;
  title?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
}

export interface SessionConflict {
  conflict_type: string;
  message: string;
  /** True for a soft warning (e.g. a protected date) the admin may override. */
  override_allowed: boolean;
  affected_entities: ConflictEntity[];
  /** For a room clash: ids of rooms that are free. */
  resolution_hints: Array<number | string>;
}

export interface ConflictFieldErrors {
  instructors?: boolean;
  location?: boolean;
  startDate?: boolean;
  startTime?: boolean;
  endTime?: boolean;
}

const ROOM_DOUBLE_BOOKING = 'ROOM_DOUBLE_BOOKING';

/** Which fields to highlight red for the active conflict. */
export const getConflictFieldErrors = (conflict: SessionConflict | null): ConflictFieldErrors => {
  switch (conflict?.conflict_type) {
    case 'INSTRUCTOR_DOUBLE_BOOKING': return { instructors: true };
    case ROOM_DOUBLE_BOOKING: return { location: true };
    case 'TRAINEE_CLASH': return { startTime: true, endTime: true };
    case 'PROTECTED_DATE': return { startDate: true };
    default: return {};
  }
};

const formatClock = (value?: string): string => (
  new Date(value as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
);

const TimeRange = ({ entity }: { entity: ConflictEntity }) => (
  <>
    {formatClock(entity.scheduled_start_time)}
    {' – '}
    {formatClock(entity.scheduled_end_time)}
  </>
);

const OptionalTimeRange = ({ entity }: { entity: ConflictEntity }) => (
  entity.scheduled_start_time ? <>{' · '}<TimeRange entity={entity} /></> : null
);

const ConflictEntityLine = ({ entity }: { entity: ConflictEntity }) => {
  if (entity.type === 'instructor') {
    return (
      <>
        <strong>{entity.full_name || entity.email}</strong>
        {entity.full_name && entity.email && ` (${entity.email})`}
        {' is teaching '}
        &ldquo;{entity.conflicting_session_name}&rdquo;
        {entity.program_name && ` (${entity.program_name})`}
        <OptionalTimeRange entity={entity} />
      </>
    );
  }
  if (entity.type === 'room') {
    return (
      <>
        &ldquo;{entity.name}&rdquo; is booked
        {entity.session_title && ` for “${entity.session_title}”`}
        {entity.program_name && ` (${entity.program_name})`}
        <OptionalTimeRange entity={entity} />
      </>
    );
  }
  return (
    <>
      <strong>{entity.title}</strong>
      {': '}
      <TimeRange entity={entity} />
    </>
  );
};

const availableRoomNames = (conflict: SessionConflict, locationOptions: SelectOption[]): string => (
  conflict.resolution_hints
    .map((id) => locationOptions.find((o) => o.value === id)?.label)
    .filter(Boolean)
    .join(', ') || 'check Locations for availability'
);

interface ConflictAlertsProps {
  conflict: SessionConflict | null;
  locationOptions: SelectOption[];
  isSaving: boolean;
  onProceed: () => void;
  onDismiss: () => void;
  alertRef: React.Ref<HTMLDivElement>;
}

/** A hard conflict the admin must resolve, or a soft one they may proceed past. */
const ConflictAlerts = ({
  conflict, locationOptions, isSaving, onProceed, onDismiss, alertRef,
}: ConflictAlertsProps) => {
  if (!conflict) { return null; }
  if (conflict.override_allowed) {
    return (
      <Alert variant="warning" className="mb-3" ref={alertRef}>
        <strong>{conflict.message}</strong>
        <div className="mt-2">
          <Button size="sm" variant="primary" onClick={onProceed} disabled={isSaving}>
            Proceed anyway
          </Button>
          <Button size="sm" variant="tertiary" onClick={onDismiss} className="ml-2">
            Cancel
          </Button>
        </div>
      </Alert>
    );
  }
  return (
    <Alert variant="danger" className="mb-3" ref={alertRef}>
      <strong>{conflict.message}</strong>
      <ul className="mt-2 mb-0 pl-4">
        {conflict.affected_entities.map((entity, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={i}><ConflictEntityLine entity={entity} /></li>
        ))}
      </ul>
      {conflict.conflict_type === ROOM_DOUBLE_BOOKING && conflict.resolution_hints.length > 0 && (
        <div className="mt-2 fbr-schedule-meeting__hint">
          Available rooms:{' '}
          {availableRoomNames(conflict, locationOptions)}
        </div>
      )}
    </Alert>
  );
};

export default ConflictAlerts;
