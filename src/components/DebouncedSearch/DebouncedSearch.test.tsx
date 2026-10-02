import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import DebouncedSearch from './DebouncedSearch';

describe('DebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders successfully with only the required `onSearch` prop', () => {
    render(<DebouncedSearch onSearch={jest.fn()} label="Search programs" />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  // userEvent's internal waits are also timer-based, so they need to share
  // the fake-timer clock or `await user.type(...)` calls hang indefinitely.
  const setupUser = () => userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });

  it('does not call onSearch immediately as the user types', async () => {
    const onSearch = jest.fn();
    const user = setupUser();
    render(<DebouncedSearch onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'abc');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch once with the final value after the debounce delay elapses', async () => {
    const onSearch = jest.fn();
    const user = setupUser();
    render(<DebouncedSearch onSearch={onSearch} delay={300} />);

    await user.type(screen.getByRole('searchbox'), 'abc');
    jest.advanceTimersByTime(299);
    expect(onSearch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('abc');
  });

  it('resets the pending timer on every keystroke, so only the settled value is searched', async () => {
    const onSearch = jest.fn();
    const user = setupUser();
    render(<DebouncedSearch onSearch={onSearch} delay={300} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'a');
    jest.advanceTimersByTime(200);
    await user.type(input, 'b');
    jest.advanceTimersByTime(200);

    expect(onSearch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('ab');
  });

  it('uses a default delay of 400ms when none is supplied', async () => {
    const onSearch = jest.fn();
    const user = setupUser();
    render(<DebouncedSearch onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'x');
    jest.advanceTimersByTime(399);
    expect(onSearch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledWith('x');
  });

  it('bypasses the debounce and calls onSearch immediately on submit', async () => {
    const onSearch = jest.fn();
    const onSubmit = jest.fn();
    const user = setupUser();
    render(<DebouncedSearch onSearch={onSearch} onSubmit={onSubmit} delay={500} />);

    await user.type(screen.getByRole('searchbox'), 'query{enter}');

    expect(onSearch).toHaveBeenCalledWith('query');
    expect(onSubmit).toHaveBeenCalledWith('query');
  });

  it('does not call the pending debounced search again after a submit already fired it', async () => {
    const onSearch = jest.fn();
    const user = setupUser();
    render(<DebouncedSearch onSearch={onSearch} delay={500} />);

    await user.type(screen.getByRole('searchbox'), 'query{enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('bypasses the debounce and calls onSearch with an empty string on clear', async () => {
    const onSearch = jest.fn();
    const onClear = jest.fn();
    const user = setupUser();
    render(<DebouncedSearch onSearch={onSearch} onClear={onClear} value="something" />);

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onSearch).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('syncs the input value when the `value` prop changes externally', () => {
    const { rerender } = render(<DebouncedSearch onSearch={jest.fn()} value="first" />);

    expect(screen.getByRole('searchbox')).toHaveValue('first');

    rerender(<DebouncedSearch onSearch={jest.fn()} value="second" />);

    expect(screen.getByRole('searchbox')).toHaveValue('second');
  });

  it('passes through label and placeholder to the underlying SearchField', () => {
    render(<DebouncedSearch onSearch={jest.fn()} label="Search programs" placeholder="Type to search" />);

    expect(screen.getByPlaceholderText('Type to search')).toBeInTheDocument();
  });

  it('cleans up the pending timer on unmount without throwing', async () => {
    const onSearch = jest.fn();
    const user = setupUser();
    const { unmount } = render(<DebouncedSearch onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'abc');

    expect(() => unmount()).not.toThrow();

    jest.advanceTimersByTime(1000);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
