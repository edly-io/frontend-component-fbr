import { useEffect, useState } from 'react';

/**
 * Sends focus back to the control that opened a modal once the modal unmounts,
 * however it was closed (Close button, X or Escape). The trigger is read during
 * the first render, before the modal moves focus inside itself.
 */
const useReturnFocus = () => {
  const [trigger] = useState(() => (typeof document === 'undefined' ? null : document.activeElement as HTMLElement | null));
  useEffect(() => () => {
    setTimeout(() => {
      if (trigger?.isConnected) {
        trigger.focus();
      }
    });
  }, [trigger]);
};

export default useReturnFocus;
