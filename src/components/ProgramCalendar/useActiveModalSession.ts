import { useSession } from '../../data/sessions/hooks';
import { CalendarSession } from './types';

// Modals that show one session, named by `?modal=` with its id in `?id=`.
const SESSION_MODALS = ['session', 'edit-session', 'delete-session', 'cancel-session'];
const DETAIL_ERROR = 'Failed to load session details.';

/**
 * The session the open modal shows: from the loaded window when it's there,
 * otherwise fetched by id (a deep link to a session outside the window). A
 * failed fetch shows an error but leaves `?modal=&id=` in the URL, so the same
 * URL can still open the modal once the session loads.
 */
const useActiveModalSession = (
  modal: string | null,
  modalId: string | null,
  sessions: CalendarSession[],
) => {
  const isSessionModal = Boolean(modal && SESSION_MODALS.includes(modal) && modalId);
  const fromWindow = isSessionModal
    ? sessions.find((s) => String(s.id) === String(modalId))
    : undefined;
  const needsFetch = isSessionModal && !fromWindow;
  const sessionQuery = useSession(needsFetch ? modalId : null);

  const fetched = needsFetch ? (sessionQuery.data as CalendarSession | undefined) : undefined;
  return {
    activeModalSession: fromWindow ?? fetched ?? null,
    detailError: needsFetch && sessionQuery.isError ? DETAIL_ERROR : '',
  };
};

export default useActiveModalSession;
