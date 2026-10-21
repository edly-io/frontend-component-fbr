import React, { ChangeEvent, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import classNames from 'classnames';
import type { Locale } from 'date-fns';
import { format, parse, isValid as isValidDateFns } from 'date-fns';
import { Form, Icon } from '@openedx/paragon';
import { AccessTime, Calendar } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import { getDateFnsLocale } from './dateFnsLocale';
import messages from './messages';
import { DATEPICKER_TYPES, DatepickerControlProps } from './types';
import './_datepicker-control.scss';

export { DATEPICKER_TYPES };

// Values keep the shape a native <input type="date"> / <input type="time"> produced,
// so callers' state and API payloads are unchanged.
export const DATEPICKER_VALUE_FORMAT = 'yyyy-MM-dd';
export const DATEPICKER_DISPLAY_FORMAT = 'dd/MM/yyyy';
export const TIMEPICKER_VALUE_FORMAT = 'HH:mm';
export const TIMEPICKER_DISPLAY_FORMAT = 'hh:mm aa';

const DEFAULT_TIME_INTERVAL_MINUTES = 15;

// Typed times are accepted in 12-hour ("09:30 AM", "9:30 pm") or 24-hour ("21:30") form.
const TIME_INPUT_FORMATS = [TIMEPICKER_DISPLAY_FORMAT, 'h:mm aa', TIMEPICKER_VALUE_FORMAT, 'H:mm'];

const isValidJsDate = (date: unknown): date is Date => date instanceof Date && !Number.isNaN(date.getTime());

const parseValue = (value: string | undefined, valueFormat: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = parse(value, valueFormat, new Date());
  return isValidDateFns(parsed) ? parsed : null;
};

const formatValue = (date: Date, valueFormat: string): string => (isValidJsDate(date) ? format(date, valueFormat) : '');

// Only a fully-typed value counts; partial input ("1", "12/0") is ignored until complete.
const parseTypedValue = (rawValue: string, inputFormats: string[]): Date | null => {
  const text = rawValue.trim().toLowerCase();
  const matchingFormat = inputFormats.find((inputFormat) => {
    const parsed = parse(text, inputFormat, new Date());
    return isValidDateFns(parsed) && format(parsed, inputFormat).toLowerCase() === text;
  });
  return matchingFormat ? parse(text, matchingFormat, new Date()) : null;
};

/** Lazily loads the date-fns locale for non-English UIs; English needs none. */
const useDateFnsLocale = (localeCode: string | undefined): Locale | undefined => {
  const [locale, setLocale] = useState<Locale | undefined>(undefined);
  const isEnglish = Boolean(localeCode?.toLowerCase().startsWith('en'));

  useEffect(() => {
    if (isEnglish) {
      return undefined;
    }
    let isMounted = true;
    getDateFnsLocale(localeCode).then((loadedLocale) => {
      if (isMounted) {
        setLocale(loadedLocale);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [localeCode, isEnglish]);

  return locale;
};

// react-datepicker doesn't forward arbitrary props (like `data-testid` or `aria-label`)
// to its own <input>, so they're carried through `customInput`.
const buildCustomInput = (dataTestId?: string, ariaLabel?: string) => {
  if (!dataTestId && !ariaLabel) {
    return undefined;
  }
  return <input data-testid={dataTestId || undefined} aria-label={ariaLabel || undefined} />;
};

const DatepickerControl = ({
  type = DATEPICKER_TYPES.date,
  label = '',
  ariaLabel = '',
  value = '',
  onChange,
  id = '',
  controlName = '',
  valueFormat = '',
  displayFormat = '',
  minDate = '',
  maxDate = '',
  timeIntervals = DEFAULT_TIME_INTERVAL_MINUTES,
  placeholder = '',
  isInvalid = false,
  helpText = '',
  readonly = false,
  required = false,
  size,
  dataTestId,
  onBlur,
  onFocus,
  renderGroup = false,
  formGroupClassName = '',
  className = '',
  inputClassName = '',
}: DatepickerControlProps) => {
  const intl = useIntl();
  const locale = useDateFnsLocale(intl.locale);
  const isTime = type === DATEPICKER_TYPES.time;
  const resolvedValueFormat = valueFormat || (isTime ? TIMEPICKER_VALUE_FORMAT : DATEPICKER_VALUE_FORMAT);
  const resolvedDisplayFormat = displayFormat || (isTime ? TIMEPICKER_DISPLAY_FORMAT : DATEPICKER_DISPLAY_FORMAT);
  const inputFormats = isTime ? [resolvedDisplayFormat, ...TIME_INPUT_FORMATS] : [resolvedDisplayFormat];

  const inputId = id || controlName || undefined;
  const helpTextId = helpText && inputId ? `${inputId}-help-text` : undefined;
  const selected = parseValue(value, resolvedValueFormat);

  const handleChange = (date: Date | null) => {
    if (isValidJsDate(date)) {
      onChange(formatValue(date, resolvedValueFormat));
    } else if (date === null) {
      onChange('');
    }
  };

  // react-datepicker's own `onChange` silently drops a typed date outside minDate/maxDate.
  // Parsing the raw text keeps the native input's contract: any fully-typed value reaches
  // `onChange`, and the caller's own validation decides what to do with it.
  const handleChangeRaw = (event?: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event?.target?.value;
    if (typeof rawValue !== 'string') {
      return;
    }
    if (rawValue === '') {
      onChange('');
      return;
    }
    const parsed = parseTypedValue(rawValue, inputFormats);
    if (parsed) {
      onChange(formatValue(parsed, resolvedValueFormat));
    }
  };

  const datepickerNode = (
    <div className={classNames('datepicker-control', className, { 'datepicker-control--sm': size === 'sm' })}>
      {!readonly && (
        <Icon
          src={isTime ? AccessTime : Calendar}
          className="datepicker-custom-control-icon"
          // Paragon's Icon forwards `alt` at runtime but its types omit it.
          {...{ alt: intl.formatMessage(isTime ? messages.clockAltText : messages.calendarAltText) }}
        />
      )}
      <DatePicker
        id={inputId}
        name={controlName || undefined}
        selected={selected}
        disabled={readonly}
        dateFormat={resolvedDisplayFormat}
        timeFormat={isTime ? resolvedDisplayFormat : undefined}
        showTimeSelect={isTime}
        showTimeSelectOnly={isTime}
        timeIntervals={timeIntervals}
        timeCaption={intl.formatMessage(messages.timeCaption)}
        className={classNames('form-control datepicker-custom-control', inputClassName, {
          'form-control-sm': size === 'sm',
          'is-invalid': isInvalid,
        })}
        autoComplete="off"
        placeholderText={placeholder
          || (isTime ? intl.formatMessage(messages.timePlaceholder) : resolvedDisplayFormat.toUpperCase())}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        // Fixed positioning lets the popup escape overflow containers such as modals.
        popperProps={{ strategy: 'fixed' }}
        strictParsing
        minDate={isTime ? undefined : parseValue(minDate, resolvedValueFormat)}
        maxDate={isTime ? undefined : parseValue(maxDate, resolvedValueFormat)}
        locale={locale}
        required={required}
        ariaInvalid={isInvalid ? 'true' : undefined}
        ariaRequired={required ? 'true' : undefined}
        ariaDescribedBy={helpTextId}
        customInput={buildCustomInput(dataTestId, ariaLabel)}
        previousMonthAriaLabel={intl.formatMessage(messages.previousMonthAriaLabel)}
        nextMonthAriaLabel={intl.formatMessage(messages.nextMonthAriaLabel)}
        previousYearAriaLabel={intl.formatMessage(messages.previousYearAriaLabel)}
        nextYearAriaLabel={intl.formatMessage(messages.nextYearAriaLabel)}
        monthAriaLabelPrefix={intl.formatMessage(messages.monthAriaLabelPrefix)}
        chooseDayAriaLabelPrefix={intl.formatMessage(messages.chooseDayAriaLabelPrefix)}
        disabledDayAriaLabelPrefix={intl.formatMessage(messages.disabledDayAriaLabelPrefix)}
        onBlur={onBlur}
        onFocus={onFocus}
        onChange={handleChange}
        onChangeRaw={handleChangeRaw}
      />
    </div>
  );

  if (!renderGroup) {
    return datepickerNode;
  }

  return (
    <Form.Group
      controlId={inputId}
      className={classNames('datepicker-custom-group', formGroupClassName)}
    >
      <Form.Label htmlFor={inputId}>{label}</Form.Label>
      {datepickerNode}
      {helpText && <Form.Control.Feedback id={helpTextId}>{helpText}</Form.Control.Feedback>}
    </Form.Group>
  );
};

export default DatepickerControl;
