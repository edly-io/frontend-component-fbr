import { getSessionStartLink } from '../../data/sessions/api';

const START_LINK_ERROR = 'Could not open the meeting start link. Please try again.';

/**
 * Fetch a fresh Zoom host start link and open it. The link is minted on demand
 * (it expires ~2h after Zoom generates it), so open a blank tab first — inside
 * the click gesture, to dodge popup blockers — then navigate it once the link
 * arrives. opener is nulled to keep the no-opener protection without
 * 'noopener', which would otherwise deny us the window handle. Never cached.
 */
const openSessionStartLink = async (sessionId: number | string) => {
  const win = window.open('about:blank', '_blank');
  if (win) { win.opener = null; }
  try {
    const url = await getSessionStartLink(sessionId);
    if (!url) { throw new Error('No start link returned'); }
    if (win) { win.location.href = url; } else { window.open(url, '_blank', 'noopener,noreferrer'); }
  } catch (err) {
    if (win) { win.close(); }
    // eslint-disable-next-line no-alert
    window.alert(START_LINK_ERROR);
  }
};

export default openSessionStartLink;
