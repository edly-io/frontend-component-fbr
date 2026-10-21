import React from 'react';
import { Button, IconButton } from '@openedx/paragon';
import { Add, ChevronLeft, ChevronRight } from '@openedx/paragon/icons';
import { CALENDAR_VIEWS, capitalize, formatRangeLabel } from './calendarDates';
import CalendarPdfDownloadButton from './CalendarPdfDownloadButton';
import { CalendarSession, CalendarViewMode } from './types';

interface CalendarToolbarProps {
  view: CalendarViewMode;
  currentDate: Date;
  sessions: CalendarSession[];
  canManageSessions: boolean;
  programName: string;
  sessionTypeLabels: Record<string, string>;
  onNavigate: (direction: number) => void;
  onGoToToday: () => void;
  onViewChange: (view: CalendarViewMode) => void;
  onScheduleNew: () => void;
}

/** Previous / Today / Next, the range label, the view toggles, PDF export and "New session". */
const CalendarToolbar = ({
  view, currentDate, sessions, canManageSessions, programName, sessionTypeLabels,
  onNavigate, onGoToToday, onViewChange, onScheduleNew,
}: CalendarToolbarProps) => {
  const rangeLabel = formatRangeLabel(view, currentDate);
  return (
    <div className="d-flex align-items-center flex-wrap mb-3 calendar-toolbar">
      <IconButton src={ChevronLeft} iconAs={ChevronLeft} alt="Previous" onClick={() => onNavigate(-1)} size="sm" />
      <Button variant="outline-primary" size="sm" onClick={onGoToToday}>Today</Button>
      <IconButton src={ChevronRight} iconAs={ChevronRight} alt="Next" onClick={() => onNavigate(1)} size="sm" />

      <span className="calendar-toolbar__label">{rangeLabel}</span>

      {/* View toggles + export + New session — pushed to the right */}
      <div className="ml-auto d-flex align-items-center calendar-toolbar__actions">
        <div className="d-flex align-items-center calendar-toolbar__group">
          {Object.values(CALENDAR_VIEWS).map((v) => (
            <Button key={v} variant={view === v ? 'primary' : 'outline-primary'} size="sm" onClick={() => onViewChange(v)}>
              {capitalize(v)}
            </Button>
          ))}
        </div>
        <span className="calendar-toolbar__divider" />
        <div className="d-flex align-items-center calendar-toolbar__group">
          <CalendarPdfDownloadButton
            sessions={sessions}
            rangeLabel={rangeLabel}
            viewLabel={capitalize(view)}
            programName={programName}
            sessionTypeLabels={sessionTypeLabels}
          />
          {canManageSessions && (
            <>
              <span className="calendar-toolbar__divider calendar-toolbar__divider--inline" />
              <Button variant="primary" size="sm" iconBefore={Add} onClick={onScheduleNew}>New session</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarToolbar;
