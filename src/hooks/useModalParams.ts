import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const MODAL_PARAM = 'modal';
const ID_PARAM = 'id';

export interface ModalParams {
  modal: string | null;
  modalId: string | null;
  openModal: (name: string, id?: string | number | null) => void;
  closeModal: () => void;
}

/** Keeps the open modal (and the record it shows) in the URL as `?modal=&id=`. */
const useModalParams = (): ModalParams => {
  const [searchParams, setSearchParams] = useSearchParams();

  const modal = searchParams.get(MODAL_PARAM);
  const modalId = searchParams.get(ID_PARAM);

  const openModal = useCallback((name: string, id: string | number | null = null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(MODAL_PARAM, name);
      if (id !== null) { next.set(ID_PARAM, String(id)); } else { next.delete(ID_PARAM); }
      return next;
    });
  }, [setSearchParams]);

  // Replaces the history entry so Back after Close does not reopen the modal (#493).
  const closeModal = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(MODAL_PARAM);
      next.delete(ID_PARAM);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    modal, modalId, openModal, closeModal,
  };
};

export default useModalParams;
