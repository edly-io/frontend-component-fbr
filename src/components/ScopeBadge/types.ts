export type SessionScope = 'public' | 'gated' | 'in_person';

export interface ScopeBadgeProps {
  scope: SessionScope;
}
