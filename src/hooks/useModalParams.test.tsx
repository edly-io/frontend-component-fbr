import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MemoryRouter, Route, Routes, useNavigate,
} from 'react-router-dom';

import useModalParams from './useModalParams';

const Harness = () => {
  const {
    modal, modalId, openModal, closeModal,
  } = useModalParams();
  const navigate = useNavigate();

  return (
    <div>
      <div data-testid="search-params">modal={modal};id={modalId}</div>
      <button type="button" onClick={() => openModal('session', '123')}>Open</button>
      <button type="button" onClick={() => closeModal()}>Close</button>
      <button type="button" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

const renderHarness = () => render(
  <MemoryRouter initialEntries={['/calendar']}>
    <Routes>
      <Route path="/calendar" element={<Harness />} />
    </Routes>
  </MemoryRouter>,
);

it('does not reopen the modal when navigating Back after Cancel/Close (issue #493)', () => {
  renderHarness();

  expect(screen.getByTestId('search-params')).toHaveTextContent('modal=;id=');

  fireEvent.click(screen.getByText('Open'));
  expect(screen.getByTestId('search-params')).toHaveTextContent('modal=session;id=123');

  fireEvent.click(screen.getByText('Close'));
  expect(screen.getByTestId('search-params')).toHaveTextContent('modal=;id=');

  // Close replaced the open-modal history entry instead of stacking a new
  // one, so a single Back press lands on the original pre-modal entry,
  // not on the now-removed open-modal entry.
  fireEvent.click(screen.getByText('Back'));
  expect(screen.getByTestId('search-params')).toHaveTextContent('modal=;id=');
});
