import React from 'react';
import { render, screen } from '@testing-library/react';
import SectionHeading from './SectionHeading';

describe('SectionHeading', () => {
  it('renders its children as a level-3 heading', () => {
    render(<SectionHeading>Upcoming sessions</SectionHeading>);
    expect(screen.getByRole('heading', { level: 3, name: 'Upcoming sessions' })).toBeInTheDocument();
  });
});
