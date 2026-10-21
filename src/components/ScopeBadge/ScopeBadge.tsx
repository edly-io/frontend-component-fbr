import React from 'react';
import {
  Badge, OverlayTrigger, Tooltip, Icon,
} from '@openedx/paragon';
import { InfoOutline } from '@openedx/paragon/icons';
import { ScopeBadgeProps, SessionScope } from './types';
import './ScopeBadge.scss';

interface ScopeDefinition {
  label: string;
  variant: string;
  tooltip: string;
}

const SCOPES: Record<SessionScope, ScopeDefinition> = {
  public: {
    label: 'Open to all learners',
    variant: 'success',
    tooltip: 'Zoom link is visible to every enrolled learner in this course.',
  },
  gated: {
    label: 'Approved learners only',
    variant: 'warning',
    tooltip: 'Zoom link created after approving a remote-attendance request. Only learners whose requests you approved can see it.',
  },
  in_person: {
    label: 'In-person',
    variant: 'secondary',
    tooltip: 'No Zoom link. This session happens in-person only.',
  },
};

const ScopeBadge = ({ scope }: ScopeBadgeProps) => {
  const definition = SCOPES[scope];
  if (!definition) { return null; }
  return (
    <span className="fbr-scope-badge">
      <Badge variant={definition.variant}>{definition.label}</Badge>
      <OverlayTrigger
        trigger={['hover', 'focus']}
        placement="top"
        overlay={<Tooltip id={`scope-tip-${scope}`}>{definition.tooltip}</Tooltip>}
      >
        <button type="button" aria-label={definition.tooltip} className="fbr-scope-badge__info">
          <Icon src={InfoOutline} className="fbr-scope-badge__icon" />
        </button>
      </OverlayTrigger>
    </span>
  );
};

export default ScopeBadge;
