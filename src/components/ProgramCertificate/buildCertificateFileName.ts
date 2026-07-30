// Build the default PDF filename (the print document's <title>, which browsers
// use as the Save-as-PDF filename). Union of the two former MFE helpers:
// sanitize filesystem-unsafe chars (authoring) AND drop empty parts (sessions).
const FILENAME_UNSAFE_CHARS = /[\\/:*?"<>|]/g;
const CERTIFICATE_SUFFIX = 'Certificate';

const sanitizePart = (value: string): string => value.replace(FILENAME_UNSAFE_CHARS, '').trim();

export const buildCertificateFileName = (traineeName: string, programName: string): string => (
  [traineeName, programName, CERTIFICATE_SUFFIX]
    .map(sanitizePart)
    .filter(Boolean)
    .join(' - ')
);
