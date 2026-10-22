import React from 'react';
import { render } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import DatepickerControl from './DatepickerControl';

const mockDatePicker = jest.fn<null, [Record<string, unknown>]>(() => null);

jest.mock('react-datepicker', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => mockDatePicker(props),
}));

const renderControl = (props: Record<string, unknown> = {}) => render(
  <IntlProvider locale="en">
    <DatepickerControl onChange={jest.fn()} label="Start date" {...props} />
  </IntlProvider>,
);

describe('<DatepickerControl /> popup placement', () => {
  beforeEach(() => mockDatePicker.mockClear());

  it('opens below the field with fixed positioning so modals do not clip it', () => {
    renderControl();
    const props = mockDatePicker.mock.calls[0][0];
    expect(props.popperPlacement).toBe('bottom-start');
    expect(props.popperProps).toEqual({ strategy: 'fixed' });
  });

  it('renders without a form group when renderGroup is not set', () => {
    const { container, queryByText } = renderControl();
    expect(container.querySelector('.datepicker-custom-group')).toBeNull();
    expect(queryByText('Start date')).toBeNull();
  });
});
