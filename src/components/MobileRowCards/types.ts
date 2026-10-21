import { ReactNode } from 'react';

export interface MobileRowCardsListProps {
  children: ReactNode;
}

export interface MobileRowCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export interface MobileRowFieldProps {
  label: ReactNode;
  children: ReactNode;
}
