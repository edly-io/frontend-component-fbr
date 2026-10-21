import React from 'react';
import { render, screen } from '@testing-library/react';
import InstructingBadge from './InstructingBadge';

describe('InstructingBadge', () => {
  it('renders the Instructing label', () => {
    render(<InstructingBadge />);
    expect(screen.getByText('Instructing')).toBeInTheDocument();
  });
});
