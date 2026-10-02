import React, { useCallback, useEffect, useRef } from 'react';
import { SearchField } from '@openedx/paragon';
import { DebouncedSearchProps } from './types';

const DEFAULT_DELAY = 400;

// `SearchField` already manages its own internal value (re-syncing whenever
// the `value` prop changes) and treats `onChange` as a notification, not a
// setter to feed back into a parent-controlled `value`. Mirroring `value`
// into local state here and passing it back down would fight that internal
// sync and loop forever, so this component only intercepts the callbacks to
// add debouncing and lets `SearchField` own the actual input value.
const DebouncedSearch = ({
  onSearch,
  delay = DEFAULT_DELAY,
  value,
  onSubmit,
  onClear,
  ...searchFieldProps
}: DebouncedSearchProps) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const clearPendingSearch = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleChange = useCallback((newValue: string) => {
    clearPendingSearch();
    timeoutRef.current = setTimeout(() => onSearch(newValue), delay);
  }, [onSearch, delay]);

  const handleSubmit = useCallback((submittedValue: string) => {
    clearPendingSearch();
    onSearch(submittedValue);
    onSubmit?.(submittedValue);
  }, [onSearch, onSubmit]);

  const handleClear = useCallback(() => {
    clearPendingSearch();
    onSearch('');
    onClear?.();
  }, [onSearch, onClear]);

  return (
    <SearchField
      {...searchFieldProps}
      value={value}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onClear={handleClear}
    />
  );
};

export default DebouncedSearch;
