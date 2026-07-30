import React, { useLayoutEffect, useRef } from 'react';

import './certificate.scss';
import { CertificateFitMode, CertificateHtmlViewProps } from './types';

// Native design size of the certificate (px) — mirrors the backend template.
const CERT_WIDTH = 1123;
const CERT_HEIGHT = 710;
// Fixed vertical chrome budget around the modal preview (header + footer +
// body padding + dialog margins); a fixed budget avoids a feedback loop with
// the modal's vertical centring.
const MODAL_CHROME = 256;

const useFitScale = (mode: CertificateFitMode, html: string) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) {
      return undefined;
    }
    const apply = () => {
      if (mode === 'fit') {
        const availWidth = parent.clientWidth;
        if (availWidth <= 0) {
          return;
        }
        const availHeight = window.innerHeight - MODAL_CHROME;
        const scale = availHeight > 0
          ? Math.min(availWidth / CERT_WIDTH, availHeight / CERT_HEIGHT)
          : availWidth / CERT_WIDTH;
        el.style.width = `${CERT_WIDTH * scale}px`;
        el.style.height = `${CERT_HEIGHT * scale}px`;
        el.style.setProperty('--fit-scale', String(scale));
        return;
      }
      const width = el.clientWidth;
      if (width > 0) {
        el.style.setProperty('--fit-scale', String(width / CERT_WIDTH));
      }
    };
    apply();
    const raf = requestAnimationFrame(apply);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply);
    observer?.observe(mode === 'fit' ? parent : el);
    window.addEventListener('resize', apply);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, [mode, html]);
  return ref;
};

/**
 * Thin host for a backend-rendered certificate: injects the final HTML string
 * and scales it to fit. The FBR design lives entirely in the backend template
 * (and its inlined `<style>`), so this component carries no certificate styling
 * — only the scale wrapper + print behaviour shared by every host.
 *
 * Trust: `html` comes only from our own certificate endpoints, rendered
 * server-side by Django with autoescape ON, so attacker-controlled data (names,
 * issued_by) is escaped to inert text; the template itself is super-admin-only.
 * Hardening the residual super-admin-template vector with a sandboxed iframe is
 * deferred — see TECH_DEBT.md [TD-007].
 */
const CertificateHtmlView: React.FC<CertificateHtmlViewProps> = ({ html, mode = 'fill' }) => {
  const scaleRef = useFitScale(mode, html);
  return (
    <div
      className="fbr-cert-scale"
      ref={scaleRef}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default CertificateHtmlView;
