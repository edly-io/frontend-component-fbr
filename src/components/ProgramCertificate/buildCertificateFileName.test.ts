import { buildCertificateFileName } from './buildCertificateFileName';

describe('buildCertificateFileName', () => {
  it('joins trainee, program, and "Certificate" with " - "', () => {
    expect(buildCertificateFileName('Jawad Ali', 'Marker Program'))
      .toBe('Jawad Ali - Marker Program - Certificate');
  });

  it('strips filesystem-unsafe characters', () => {
    expect(buildCertificateFileName('A/B:C', 'Prog?*'))
      .toBe('ABC - Prog - Certificate');
  });

  it('drops empty parts instead of leaving a stray separator', () => {
    expect(buildCertificateFileName('', 'Marker Program'))
      .toBe('Marker Program - Certificate');
  });
});
