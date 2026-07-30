export type CertificateFitMode = 'fill' | 'fit';

export interface CertificateHtmlViewProps {
  /** Final, server-rendered certificate HTML (a `.fbr-cert` document with its
   * own inlined styles). Injected verbatim; this component adds no design. */
  html: string;
  /**
   * 'fill' (default): scale to the container width (settings live preview).
   * 'fit': scale to fit both container width and remaining viewport height
   * (the modal), so the whole certificate is visible with no scrolling.
   */
  mode?: CertificateFitMode;
}

export interface PrintCertificateButtonProps {
  /** Final, server-rendered certificate HTML string to print. */
  html: string;
  traineeName: string;
  programName: string;
  /** Button label. Defaults to "Print / Save as PDF". */
  label?: string;
  /** Paragon Button variant. Defaults to "outline-primary". */
  variant?: string;
  className?: string;
}
