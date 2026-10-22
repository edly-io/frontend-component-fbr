import React from 'react';
import { render, screen } from '@testing-library/react';
import { MobileRowCard, MobileRowCardsList, MobileRowField } from './MobileRowCards';

describe('MobileRowCards', () => {
  it('renders a card with title, subtitle, fields and footer', () => {
    render(
      <MobileRowCardsList>
        <MobileRowCard title="IRSA 1" subtitle="Karachi" footer={<button type="button">Edit</button>}>
          <MobileRowField label="Capacity">40</MobileRowField>
        </MobileRowCard>
      </MobileRowCardsList>,
    );
    expect(screen.getByText('IRSA 1')).toBeInTheDocument();
    expect(screen.getByText('Karachi')).toBeInTheDocument();
    expect(screen.getByText('Capacity')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('omits the optional subtitle, body and footer', () => {
    const { container } = render(<MobileRowCard title="Only title" />);
    expect(container.querySelector('.mobile-row-card__subtitle')).toBeNull();
    expect(container.querySelector('.mobile-row-card__body')).toBeNull();
    expect(container.querySelector('.mobile-row-card__footer')).toBeNull();
  });
});
