export type DebouncedSearchVariant = 'light' | 'dark';

export type DebouncedSearchButtonLocation = 'internal' | 'external';

export interface DebouncedSearchProps {
  /** Called with the current value after `delay` ms of no further changes. */
  onSearch: (value: string) => void;
  /** Debounce delay, in ms. Defaults to 400. */
  delay?: number;
  value?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  screenReaderText?: {
    label?: string;
    submitButton?: string;
    clearButton?: string;
  };
  formAriaLabel?: string;
  inputProps?: Record<string, unknown>;
  variant?: DebouncedSearchVariant;
  disabled?: boolean;
  submitButtonLocation?: DebouncedSearchButtonLocation;
  buttonText?: string;
  /** Bypasses the debounce - fires immediately, in addition to `onSearch`. */
  onSubmit?: (value: string) => void;
  /** Bypasses the debounce - fires immediately, in addition to `onSearch`. */
  onClear?: () => void;
}
