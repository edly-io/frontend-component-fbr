import React from 'react';
import classNames from 'classnames';
import {
  Form, OverlayTrigger, Tooltip,
} from '@openedx/paragon';
import { DatepickerControl } from '../DatepickerControl';
import {
  ALL_WEEK_DAYS, buildSummary, getMaxEndDate, getMonthWeekLabel, getWeekdayName, LAST_SAFE_MONTH_DAY,
  MAX_END_COUNT, MAX_END_MONTHS, MonthlyMode, RECURRENCE_TYPES, RecurrenceState, RecurrenceType,
} from './recurrence';

interface RecurrenceFieldsProps {
  recurrence: RecurrenceState;
  onChange: (patch: Partial<RecurrenceState>) => void;
  /** datetime-local start of the series; caps the end date. */
  scheduledStart: string;
  disabled: boolean;
}

interface SectionProps {
  recurrence: RecurrenceState;
  onChange: (patch: Partial<RecurrenceState>) => void;
}

const clampEndCount = (value: number): number => Math.min(MAX_END_COUNT, Math.max(1, value));

const WeeklyDays = ({ recurrence, onChange }: SectionProps) => {
  const { weeklyDays } = recurrence;
  const toggleDay = (day: number) => onChange({
    weeklyDays: weeklyDays.includes(day) ? weeklyDays.filter((d) => d !== day) : [...weeklyDays, day],
  });
  return (
    <Form.Group className="mb-3">
      <Form.Label>Repeat on</Form.Label>
      <div className="d-flex fbr-schedule-meeting__weekdays">
        {ALL_WEEK_DAYS.map((day) => {
          const selected = weeklyDays.includes(day.value);
          return (
            <OverlayTrigger
              key={day.value}
              placement="top"
              overlay={<Tooltip id={`day-tip-${day.value}`}>{day.fullName}</Tooltip>}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => toggleDay(day.value)}
                className={classNames('fbr-schedule-meeting__weekday', {
                  'fbr-schedule-meeting__weekday--selected': selected,
                })}
              >
                {day.letter}
              </button>
            </OverlayTrigger>
          );
        })}
      </div>
      {weeklyDays.length === 0 && (
        <small className="text-danger d-block mt-1">Select at least one day.</small>
      )}
    </Form.Group>
  );
};

const MonthlyPattern = ({ recurrence, onChange }: SectionProps) => {
  const { monthlyDay, monthlyWeek, monthlyWeekDay } = recurrence;
  const weekLabel = getMonthWeekLabel(monthlyWeek).toLowerCase() || 'first';
  const weekdayName = getWeekdayName(monthlyWeekDay) || 'Monday';
  return (
    <Form.Group className="mb-3">
      <Form.Control
        as="select"
        value={recurrence.monthlyMode}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ monthlyMode: e.target.value as MonthlyMode })}
        size="sm"
        className="fbr-schedule-meeting__select-auto"
      >
        {monthlyDay <= LAST_SAFE_MONTH_DAY && (
          <option value="day">Monthly on day {monthlyDay}</option>
        )}
        <option value="week">{`Monthly on the ${weekLabel} ${weekdayName}`}</option>
      </Form.Control>
      {monthlyDay > LAST_SAFE_MONTH_DAY && (
        <small className="text-muted d-block mt-1">
          Day {monthlyDay} doesn’t exist in all months, so only the weekday option is available.
        </small>
      )}
    </Form.Group>
  );
};

const EndOptions = ({ recurrence, onChange, scheduledStart }: SectionProps & { scheduledStart: string }) => {
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/\D/g, ''), 10);
    onChange(Number.isNaN(value) ? { endType: 'count' } : { endType: 'count', endCount: clampEndCount(value) });
  };
  return (
    <Form.Group className="mb-3">
      <Form.Label>Ends</Form.Label>
      <div className="fbr-schedule-meeting__ends">
        <div className="d-flex fbr-schedule-meeting__recurrence-end-row">
          <div className="d-flex align-items-center fbr-schedule-meeting__end-option">
            <input type="radio" id="end-date" name="endType" checked={recurrence.endType === 'date'} onChange={() => onChange({ endType: 'date' })} />
            <label htmlFor="end-date" className="mb-0 fbr-schedule-meeting__end-label">On</label>
          </div>
          <div className="fbr-schedule-meeting__recurrence-end-content">
            <DatepickerControl
              value={recurrence.endDate}
              onChange={(value) => onChange({ endType: 'date', endDate: value })}
              onFocus={() => onChange({ endType: 'date' })}
              ariaLabel="Recurrence end date"
              size="sm"
              className="fbr-schedule-meeting__recurrence-end-date"
              maxDate={getMaxEndDate(scheduledStart)}
            />
            <small className="fbr-schedule-meeting__end-max">(max {MAX_END_MONTHS} months)</small>
          </div>
        </div>
        <div className="d-flex fbr-schedule-meeting__recurrence-end-row">
          <div className="d-flex align-items-center fbr-schedule-meeting__end-option">
            <input type="radio" id="end-count" name="endType" checked={recurrence.endType === 'count'} onChange={() => onChange({ endType: 'count' })} />
            <label htmlFor="end-count" className="mb-0 fbr-schedule-meeting__end-label">After</label>
          </div>
          <div className="fbr-schedule-meeting__recurrence-end-content">
            <div className="d-flex align-items-center fbr-schedule-meeting__count-row">
              <Form.Control
                type="text"
                inputMode="numeric"
                value={recurrence.endCount}
                onChange={handleCountChange}
                onClick={() => onChange({ endType: 'count' })}
                size="sm"
                className="fbr-schedule-meeting__count-input"
              />
              <span className="fbr-schedule-meeting__count-label">occurrences</span>
            </div>
            <small className="fbr-schedule-meeting__end-max">(max {MAX_END_COUNT})</small>
          </div>
        </div>
      </div>
    </Form.Group>
  );
};

/** The recurrence panel of a new session series: pattern, end rule and a live summary. */
const RecurrenceFields = ({
  recurrence, onChange, scheduledStart, disabled,
}: RecurrenceFieldsProps) => {
  const summary = buildSummary(recurrence);
  return (
    <fieldset disabled={disabled} className="fbr-schedule-meeting__recurrence-fieldset">
      <div className="mt-3 p-3 rounded fbr-schedule-meeting__recurrence-panel">
        {/* ── Repeat every ── */}
        <div className="d-flex align-items-center mb-3 fbr-schedule-meeting__repeat-row">
          <span className="fbr-schedule-meeting__repeat-label">Repeat every</span>
          <Form.Control
            as="select"
            value={recurrence.recurrenceType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => (
              onChange({ recurrenceType: e.target.value as RecurrenceType })
            )}
            size="sm"
            className="fbr-schedule-meeting__select-auto"
          >
            {RECURRENCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Form.Control>
        </div>
        {recurrence.recurrenceType === 'weekly' && <WeeklyDays recurrence={recurrence} onChange={onChange} />}
        {recurrence.recurrenceType === 'monthly' && <MonthlyPattern recurrence={recurrence} onChange={onChange} />}
        <EndOptions recurrence={recurrence} onChange={onChange} scheduledStart={scheduledStart} />

        {/* ── Live summary ── */}
        {summary && (
          <div className="d-flex align-items-center rounded p-2 fbr-schedule-meeting__summary">
            <span className="fbr-schedule-meeting__summary-icon">📅</span>
            <small className="fbr-schedule-meeting__summary-text">{summary}</small>
          </div>
        )}
      </div>
    </fieldset>
  );
};

export default RecurrenceFields;
