import React from 'react';
import { MobileRowCardProps, MobileRowCardsListProps, MobileRowFieldProps } from './types';
import './MobileRowCards.scss';

/** Stacked card layout that replaces a table row on narrow screens. */
export const MobileRowCardsList = ({ children }: MobileRowCardsListProps) => (
  <div className="mobile-row-cards">{children}</div>
);

export const MobileRowCard = ({
  title, subtitle = null, footer = null, children = null,
}: MobileRowCardProps) => (
  <article className="mobile-row-card">
    <header className="mobile-row-card__header">
      <div className="mobile-row-card__title">{title}</div>
      {subtitle && <div className="mobile-row-card__subtitle">{subtitle}</div>}
    </header>
    {children && <div className="mobile-row-card__body">{children}</div>}
    {footer && <div className="mobile-row-card__footer">{footer}</div>}
  </article>
);

export const MobileRowField = ({ label, children }: MobileRowFieldProps) => (
  <div className="mobile-row-card__field">
    <span className="mobile-row-card__label">{label}</span>
    <span className="mobile-row-card__value">{children}</span>
  </div>
);
