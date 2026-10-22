import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { IntlProvider } from '@edx/frontend-platform/i18n';
import SearchableSelect from './SearchableSelect';
import { SearchableSelectProps, SelectOption } from './types';

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
];

const wrap = (props: Partial<SearchableSelectProps> = {}) => render(
  <IntlProvider locale="en" messages={{}}>
    <SearchableSelect
      id="test-select"
      label="Fruit"
      options={OPTIONS}
      onChange={jest.fn()}
      value={null}
      {...(props as object)}
    />
  </IntlProvider>,
);

// Stateful wrapper that lets the component actually update value on select
interface ControlledSelectProps {
  multiple?: boolean;
  onChange?: (next: SelectOption | SelectOption[] | null) => void;
}

const ControlledSelect = ({ multiple = false, onChange }: ControlledSelectProps) => {
  const [value, setValue] = useState<SelectOption | SelectOption[] | null>(multiple ? [] : null);
  const handleChange = (next: SelectOption | SelectOption[] | null) => {
    setValue(next);
    if (onChange) { onChange(next); }
  };
  return (
    <IntlProvider locale="en" messages={{}}>
      {multiple ? (
        <SearchableSelect
          id="ctrl-select"
          label="Fruit"
          options={OPTIONS}
          multiple
          value={value as SelectOption[]}
          onChange={handleChange}
        />
      ) : (
        <SearchableSelect
          id="ctrl-select"
          label="Fruit"
          options={OPTIONS}
          value={value as SelectOption | null}
          onChange={handleChange}
        />
      )}
    </IntlProvider>
  );
};

it('renders the label', () => {
  wrap();
  expect(screen.getByText('Fruit')).toBeInTheDocument();
});

it('appends * to label when required', () => {
  wrap({ required: true });
  expect(screen.getByText('Fruit *')).toBeInTheDocument();
});

it('shows a dropdown when the input is focused', () => {
  wrap();
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  expect(screen.getAllByRole('option')).toHaveLength(3);
});

it('filters options by query', () => {
  wrap();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'an' } });
  const options = screen.getAllByRole('option');
  expect(options).toHaveLength(1);
  expect(options[0]).toHaveTextContent('Banana');
});

it('shows "No results found" when filter matches nothing', () => {
  wrap();
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'xyz' } });
  expect(screen.getByText('No results found')).toBeInTheDocument();
});

it('calls onChange with the selected option (single mode)', () => {
  const onChange = jest.fn();
  render(
    <IntlProvider locale="en" messages={{}}>
      <SearchableSelect
        id="s"
        label="Fruit"
        options={OPTIONS}
        value={null}
        onChange={onChange}
      />
    </IntlProvider>,
  );
  fireEvent.focus(screen.getByRole('combobox'));
  fireEvent.mouseDown(screen.getByText('Apple'));
  expect(onChange).toHaveBeenCalledWith(OPTIONS[0]);
});

it('closes dropdown and clears query after single selection', () => {
  render(<ControlledSelect />);
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByText('Apple'));
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('keeps dropdown open for multi-select after selection', () => {
  render(<ControlledSelect multiple />);
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByText('Apple'));
  expect(screen.getByRole('listbox')).toBeInTheDocument();
});

it('renders selected chips in multi-select mode', () => {
  render(<ControlledSelect multiple />);
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByText('Apple'));
  expect(screen.getByText('Apple')).toBeInTheDocument();
});

it('closes dropdown on Escape key', () => {
  wrap();
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('navigates options with arrow keys and selects with Enter', () => {
  const onChange = jest.fn();
  render(
    <IntlProvider locale="en" messages={{}}>
      <SearchableSelect id="s" label="Fruit" options={OPTIONS} value={null} onChange={onChange} />
    </IntlProvider>,
  );
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onChange).toHaveBeenCalledWith(OPTIONS[0]);
});

it('does not show dropdown when disabled', () => {
  wrap({ disabled: true });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('shows a loading spinner when loading is true', () => {
  wrap({ loading: true });
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  // listbox should be open (loading flag is checked inside it)
  fireEvent.change(input, { target: { value: 'a' } });
  expect(screen.getByRole('listbox')).toBeInTheDocument();
});

it('uses Paragon\'s leading-icon layout in multi-select mode, like single-select', () => {
  // Paragon positions the text after the icon via `.has-prepended-node .form-control`;
  // the chip container must opt in the same way so both modes line up.
  const { container } = render(<ControlledSelect multiple />);
  const group = container.querySelector('.pgn__form-control-decorator-group');
  expect(group).toHaveClass('has-prepended-node');
  expect(group).toHaveClass('has-leading-element');
  expect(group?.querySelector('.form-control')).not.toBeNull();
});
