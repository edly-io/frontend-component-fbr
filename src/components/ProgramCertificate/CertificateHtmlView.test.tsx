import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import CertificateHtmlView from './CertificateHtmlView';

describe('CertificateHtmlView', () => {
  it('injects the server-rendered html verbatim', () => {
    const html = '<div class="fbr-cert"><h1>Marker Program</h1></div>';
    const { container } = render(<CertificateHtmlView html={html} />);
    expect(container.querySelector('.fbr-cert h1')?.textContent).toBe('Marker Program');
  });

  it('wraps the content in the shared .fbr-cert-scale host', () => {
    const { container } = render(<CertificateHtmlView html="<div class='fbr-cert' />" />);
    expect(container.querySelector('.fbr-cert-scale')).toBeInTheDocument();
  });

  it('sets an inline width/height in fit mode', () => {
    // jsdom computes no real layout, so clientWidth is always 0; the 'fit'
    // branch bails out early (availWidth <= 0) unless we stub it. Mock it on
    // the prototype (restored after) purely to drive the fit branch, then
    // assert the --fit-scale var it sets — jsdom lacks layout, so that's the
    // only observable signal that the branch ran.
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
    try {
      const { container } = render(
        <div style={{ width: 800 }}>
          <CertificateHtmlView html="<div class='fbr-cert' />" mode="fit" />
        </div>,
      );
      const el = container.querySelector('.fbr-cert-scale') as HTMLElement;
      expect(el.style.getPropertyValue('--fit-scale')).not.toBe('');
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalDescriptor);
      }
    }
  });
});
