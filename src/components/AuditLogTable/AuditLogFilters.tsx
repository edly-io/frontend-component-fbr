import React, { ChangeEvent } from 'react';
import { Button, Form, Icon } from '@openedx/paragon';
import { Search } from '@openedx/paragon/icons';
import { DatepickerControl } from '../DatepickerControl';
import { getFilterOptions } from './labels';

const DATE_FROM_ID = 'audit-date-from';
const DATE_TO_ID = 'audit-date-to';

interface RecordFilterBannerProps {
  recordFilter: string | number;
  onClearFilter?: () => void;
}

export const RecordFilterBanner = ({ recordFilter, onClearFilter }: RecordFilterBannerProps) => (
  <div className="audit-log__filter-banner">
    <span>Showing full history for record <strong>#{recordFilter}</strong></span>
    {onClearFilter && (
      <Button variant="link" onClick={onClearFilter} className="audit-log__filter-banner-clear">
        ← Show all records
      </Button>
    )}
  </div>
);

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  minDate?: string;
  onChange: (value: string) => void;
}

const DateField = ({
  id, label, value, minDate, onChange,
}: DateFieldProps) => (
  <div className="audit-log__date-field d-flex align-items-center">
    <Form.Label htmlFor={id} className="audit-log__date-label">{label}</Form.Label>
    <DatepickerControl
      id={id}
      dataTestId={id}
      controlName={id}
      value={value}
      minDate={minDate}
      onChange={onChange}
      className="audit-log__date-input"
    />
  </div>
);

export interface AuditLogFiltersProps {
  models: string[];
  searchText: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  actionFilter: string;
  onActionChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  count: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const AuditLogFilters = ({
  models, searchText, onSearchChange, actionFilter, onActionChange,
  dateFrom, onDateFromChange, dateTo, onDateToChange, count, hasActiveFilters, onClearFilters,
}: AuditLogFiltersProps) => (
  <div className="audit-log__filters d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center flex-sm-wrap">
    <div className="audit-log__search">
      <Form.Control
        type="text"
        value={searchText}
        onChange={onSearchChange}
        placeholder="Search by record name…"
        leadingElement={<Icon src={Search} className="text-gray-500" />}
        aria-label="Search by record name"
      />
    </div>
    <div className="audit-log__action">
      <Form.Control as="select" value={actionFilter} onChange={onActionChange} aria-label="Filter by action">
        {getFilterOptions(models).map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Form.Control>
    </div>
    <div className="audit-log__date-range d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center">
      <DateField id={DATE_FROM_ID} label="From" value={dateFrom} onChange={onDateFromChange} />
      <DateField id={DATE_TO_ID} label="To" value={dateTo} minDate={dateFrom || undefined} onChange={onDateToChange} />
    </div>
    <span className="audit-log__count">
      {count} result{count !== 1 ? 's' : ''}
    </span>
    {hasActiveFilters && (
      <Button variant="tertiary" size="sm" onClick={onClearFilters} className="audit-log__clear-btn">
        Clear filters
      </Button>
    )}
  </div>
);

export default AuditLogFilters;
