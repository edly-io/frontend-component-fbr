import { FocusEventHandler } from 'react';

export const DATEPICKER_TYPES = {
  date: 'date',
  time: 'time',
} as const;

export type DatepickerType = typeof DATEPICKER_TYPES[keyof typeof DATEPICKER_TYPES];

export interface DatepickerControlProps {
  /** `date` shows a calendar; `time` shows a list of times. */
  type?: DatepickerType;
  label?: string;
  ariaLabel?: string;
  /** `yyyy-MM-dd` for dates, `HH:mm` for times (unless `valueFormat` says otherwise). */
  value?: string;
  /** Called with the new value as a string in `valueFormat`, or `''` when cleared. */
  onChange: (value: string) => void;
  id?: string;
  controlName?: string;
  valueFormat?: string;
  displayFormat?: string;
  minDate?: string;
  maxDate?: string;
  /** Minutes between the options in the time list. */
  timeIntervals?: number;
  placeholder?: string;
  isInvalid?: boolean;
  helpText?: string;
  readonly?: boolean;
  required?: boolean;
  size?: 'sm';
  dataTestId?: string;
  onBlur?: FocusEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  /** Wrap in a `Form.Group` with `label` and `helpText`. */
  renderGroup?: boolean;
  formGroupClassName?: string;
  /** Applied to the control's outer wrapper, which is what a flex/grid layout sizes. */
  className?: string;
  /** Applied to the <input> itself. */
  inputClassName?: string;
}
