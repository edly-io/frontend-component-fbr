import React from 'react';
import { Badge } from '@openedx/paragon';

import {
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_VARIANTS,
  REQUEST_TYPE,
  REQUEST_TYPE_LABELS,
} from '../../utils/constants';
import { RequestStatusBadgeProps } from './types';

const DEFAULT_VARIANT = 'secondary';

/**
 * Compact status readout of the learner's request for a given session.
 * Rendered in session popovers once a request exists; renders nothing otherwise.
 */
const RequestStatusBadge = ({ request = null }: RequestStatusBadgeProps) => {
  if (!request) { return null; }

  const { state, type_slug: typeSlug, type: typeField } = request;
  const effectiveType = typeSlug || typeField || '';
  const variant = REQUEST_STATUS_VARIANTS[state] || DEFAULT_VARIANT;
  const label = REQUEST_STATUS_LABELS[state] || state;

  if (state === REQUEST_STATUS.APPROVED && effectiveType === REQUEST_TYPE.REMOTE_SESSION) {
    return <Badge variant={variant}>Remote approved</Badge>;
  }

  if (state === REQUEST_STATUS.APPROVED && effectiveType === REQUEST_TYPE.LEAVE) {
    return <Badge variant={variant}>Leave approved</Badge>;
  }

  if (state === REQUEST_STATUS.WITHDRAWN && effectiveType === REQUEST_TYPE.LEAVE) {
    return <Badge variant={variant}>Leave withdrawn</Badge>;
  }

  return (
    <Badge variant={variant} title={REQUEST_TYPE_LABELS[effectiveType]}>
      {`${label} · ${REQUEST_TYPE_LABELS[effectiveType] || effectiveType}`}
    </Badge>
  );
};

export default RequestStatusBadge;
