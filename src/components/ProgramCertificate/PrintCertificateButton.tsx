import React from 'react';
import { Button } from '@openedx/paragon';
import { Print } from '@openedx/paragon/icons';
import printCertificate from './printCertificate';
import { buildCertificateFileName } from './buildCertificateFileName';
import { PrintCertificateButtonProps } from './types';

const DEFAULT_LABEL = 'Print / Save as PDF';

/**
 * Print/Save-as-PDF trigger for a backend-rendered certificate. Presentational
 * leaf — the host decides placement (page toolbar vs modal footer). Builds the
 * safe filename and hands the html string to printCertificate (fresh iframe);
 * it does NOT read the on-screen CertificateHtmlView.
 */
const PrintCertificateButton: React.FC<PrintCertificateButtonProps> = ({
  html,
  traineeName,
  programName,
  label = DEFAULT_LABEL,
  variant = 'outline-primary',
  className,
}) => (
  <Button
    variant={variant}
    iconBefore={Print}
    className={className}
    onClick={() => printCertificate(html, buildCertificateFileName(traineeName, programName))}
  >
    {label}
  </Button>
);

export default PrintCertificateButton;
