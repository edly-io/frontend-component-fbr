import React, {
  useState, useRef, useEffect, KeyboardEvent, ChangeEvent,
} from 'react';
import classNames from 'classnames';
import {
  Form, Icon, Spinner, Chip,
} from '@openedx/paragon';
import { Close, Search } from '@openedx/paragon/icons';
import { SearchableSelectProps, SelectOption } from './types';
import './SearchableSelect.scss';

const DEFAULT_PLACEHOLDER = 'Search...';
const NO_FOCUS = -1;

const toSelectedList = (value: SearchableSelectProps['value'], isMulti: boolean): SelectOption[] => {
  if (isMulti) { return (value as SelectOption[] | null | undefined) ?? []; }
  return value ? [value as SelectOption] : [];
};

/** Calls `onOutside` when a mousedown lands outside `ref`. */
const useClickOutside = (ref: React.RefObject<HTMLElement>, onOutside: () => void) => {
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { onOutside(); }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [ref, onOutside]);
};

/**
 * Single- or multi-select autocomplete backed by an in-memory option list.
 * Filters by label as the user types; supports ↑ / ↓ / Enter / Escape and
 * click-outside-to-close. In `multiple` mode the selection renders as
 * removable chips, and Backspace on an empty query removes the last chip.
 */
const SearchableSelect = (props: SearchableSelectProps) => {
  const {
    id, label, options = [], value = null, multiple = false, placeholder = DEFAULT_PLACEHOLDER,
    disabled = false, loading = false, required = false, isInvalid = false,
  } = props;
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(NO_FOCUS);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMulti = multiple === true;
  const selectedList = toSelectedList(value, isMulti);
  const singleValue = isMulti ? null : (value as SelectOption | null);
  const selectedIds = new Set(selectedList.map((o) => o.value));

  const emitMulti = (next: SelectOption[]) => { if (props.multiple) { props.onChange(next); } };
  const emitSingle = (next: SelectOption | null) => { if (!props.multiple) { props.onChange(next); } };

  const closeList = React.useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(NO_FOCUS);
  }, []);
  useClickOutside(containerRef, closeList);

  // Single mode: keep the query in sync when the value is cleared externally.
  useEffect(() => {
    if (!isMulti && !value) { setQuery(''); }
  }, [value, isMulti]);

  const filteredOptions = options.filter((o) => {
    if (isMulti && selectedIds.has(o.value)) { return false; }
    return o.label.toLowerCase().includes(query.toLowerCase());
  });

  const selectOption = (option: SelectOption) => {
    setQuery('');
    setFocusedIndex(NO_FOCUS);
    if (isMulti) {
      emitMulti([...selectedList, option]);
      // Keep the dropdown open for additional picks.
      setIsOpen(true);
      inputRef.current?.focus();
      return;
    }
    emitSingle(option);
    setIsOpen(false);
  };

  const removeSelected = (option: SelectOption) => {
    if (!isMulti) { return; }
    emitMulti(selectedList.filter((o) => o.value !== option.value));
    inputRef.current?.focus();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setFocusedIndex(NO_FOCUS);
    // Single mode: typing after a confirmed selection clears the selection.
    if (!isMulti && value) { emitSingle(null); }
  };

  const handleOpenListKey = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) { selectOption(filteredOptions[focusedIndex]); }
        break;
      case 'Escape':
        closeList();
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isMulti && e.key === 'Backspace' && query === '' && selectedList.length > 0) {
      e.preventDefault();
      removeSelected(selectedList[selectedList.length - 1]);
      return;
    }
    if (!isOpen) {
      if (e.key !== 'Escape') { setIsOpen(true); }
      return;
    }
    handleOpenListKey(e);
  };

  // Single mode shows the selected label; multi mode always mirrors the query.
  const inputDisplayValue = !isMulti && singleValue ? singleValue.label : query;

  const inputCommonProps = {
    id,
    type: 'text',
    value: inputDisplayValue,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    placeholder: selectedList.length > 0 && isMulti ? '' : placeholder,
    disabled,
    autoComplete: 'off',
    role: 'combobox',
    'aria-expanded': isOpen,
    'aria-autocomplete': 'list' as const,
    'aria-controls': `${id}-listbox`,
  };

  const renderMultiInput = () => (
    // Same classes Paragon's FormControlDecoratorGroup adds for a leading icon, so
    // its own `.has-prepended-node .form-control` rule spaces the chips and text
    // after the icon exactly as in single-select mode.
    <div className="pgn__form-control-decorator-group has-prepended-node has-leading-element">
      <div className="pgn__form-control-decorator pgn__form-control-decorator-leading">
        <Icon src={Search} />
      </div>
      <div
        onClick={() => { if (!disabled) { setIsOpen(true); inputRef.current?.focus(); } }}
        role="presentation"
        className={classNames(
          'form-control pgn__form-control h-auto pgn__form-control-decorator-element--leading',
          'fbr-searchable-select__chips',
          {
            'fbr-searchable-select__chips--disabled': disabled,
            'fbr-searchable-select__chips--invalid': isInvalid,
          },
        )}
      >
        {selectedList.map((opt) => (
          <Chip
            key={opt.value}
            iconAfter={Close}
            iconAfterAlt="Remove"
            onIconAfterClick={(e: React.SyntheticEvent) => {
              e.stopPropagation();
              removeSelected(opt);
            }}
            disabled={disabled}
          >
            {opt.label}
          </Chip>
        ))}
        <input
          {...inputCommonProps}
          ref={inputRef}
          onFocus={() => setIsOpen(true)}
          className="fbr-searchable-select__chip-input"
        />
      </div>
    </div>
  );

  const renderListbox = () => (
    <div id={`${id}-listbox`} role="listbox" className="fbr-searchable-select__listbox">
      {loading && (
        <div className="d-flex justify-content-center align-items-center p-3">
          <Spinner animation="border" size="sm" screenReaderText="Loading" />
        </div>
      )}
      {!loading && filteredOptions.length === 0 && (
        <div className="px-3 py-2 text-muted fbr-searchable-select__empty">No results found</div>
      )}
      {!loading && filteredOptions.map((option, index) => {
        const isSelected = !isMulti && singleValue?.value === option.value;
        return (
          <div
            key={option.value}
            role="option"
            tabIndex={-1}
            aria-selected={isSelected}
            onMouseDown={(e) => {
              e.preventDefault();
              selectOption(option);
            }}
            onMouseEnter={() => setFocusedIndex(index)}
            className={classNames('fbr-searchable-select__option', {
              'fbr-searchable-select__option--focused': index === focusedIndex,
              'fbr-searchable-select__option--selected': isSelected,
            })}
          >
            {option.label}
          </div>
        );
      })}
    </div>
  );

  return (
    <Form.Group className="mb-3">
      <Form.Label htmlFor={id}>
        {label}{required && ' *'}
      </Form.Label>
      <div ref={containerRef} className="fbr-searchable-select">
        {isMulti ? renderMultiInput() : (
          <Form.Control
            {...inputCommonProps}
            onFocus={() => { if (!value) { setIsOpen(true); } }}
            leadingElement={<Icon src={Search} />}
            isInvalid={isInvalid}
          />
        )}
        {isOpen && !disabled && renderListbox()}
      </div>
    </Form.Group>
  );
};

export default SearchableSelect;
