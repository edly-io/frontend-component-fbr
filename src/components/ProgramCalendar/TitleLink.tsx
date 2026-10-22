import React from 'react';
import { Button } from '@openedx/paragon';

interface TitleLinkProps {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  isCancelled?: boolean;
}

// Paragon's link Button, restyled by .calendar-link-button as an always-underlined
// hyperlink that darkens on hover/focus. Both popovers use it as the
// session-title click target that opens the detail modal.
const TitleLink = ({ title, onClick, isCancelled = false }: TitleLinkProps) => (
  <Button
    variant="link"
    onClick={onClick}
    aria-label={`Show details for ${title}`}
    className="calendar-link-button border-0 p-0 text-left"
  >
    <span className={isCancelled ? 'calendar-strikethrough' : undefined}>{title}</span>
  </Button>
);

export default TitleLink;
