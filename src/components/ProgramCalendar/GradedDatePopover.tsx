import React from 'react';
import {
  Badge, Button, OverlayTrigger, Popover,
} from '@openedx/paragon';
import { Launch } from '@openedx/paragon/icons';
import { ProgramDateEvent } from '../../data/sessions/types';

interface GradedDatePopoverProps {
  event: ProgramDateEvent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The amber chip or block that toggles the popover. */
  children: React.ReactElement;
}

/** Anchored to an amber due-date chip/block: the due date's details and its LMS link. */
const GradedDatePopover = ({
  event, isOpen, onOpenChange, children,
}: GradedDatePopoverProps) => {
  const dueDateLabel = new Date(event.date).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const handleOpenLms = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChange(false);
    window.open(event.link, '_blank', 'noopener,noreferrer');
  };

  const popover = (
    <Popover id={`graded-date-popover-${CSS.escape(event.id)}`} className="calendar-popover calendar-popover--graded">
      <Popover.Title as="h5" className="calendar-popover__title calendar-popover__title--graded m-0">
        {event.courseName}
      </Popover.Title>
      <Popover.Content className="calendar-popover__content">
        <div className="font-weight-bold mb-1">{event.title}</div>
        <div className="text-muted mb-2">Due: {dueDateLabel}</div>
        <div className="mb-2 d-flex calendar-popover__meta flex-wrap">
          {event.assignmentType && (
            <Badge variant="light" className="calendar-graded__badge">{event.assignmentType}</Badge>
          )}
          {event.complete && <Badge variant="success" className="calendar-badge-sm">Completed</Badge>}
        </div>
        {event.link && (
          <Button variant="outline-primary" size="sm" iconAfter={Launch} onClick={handleOpenLms}>
            Open in LMS
          </Button>
        )}
      </Popover.Content>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={isOpen}
      onToggle={(next: boolean) => onOpenChange(next)}
      trigger="click"
      placement="auto"
      rootClose
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};

export default GradedDatePopover;
