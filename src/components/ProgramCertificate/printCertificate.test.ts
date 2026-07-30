import printCertificate, { buildPrintDocument } from './printCertificate';

describe('buildPrintDocument', () => {
  it('wraps the certificate html in a full document with the title', () => {
    const doc = buildPrintDocument('<div class="fbr-cert">X</div>', 'Cert Title');
    expect(doc).toContain('<title>Cert Title</title>');
    expect(doc).toContain('<div class="fbr-cert">X</div>');
    expect(doc).toContain('@page { size: A4 landscape; margin: 0; }');
  });

  it('escapes &/< in the title', () => {
    const doc = buildPrintDocument('<div/>', 'A & B < C');
    expect(doc).toContain('<title>A &amp; B &lt; C</title>');
  });
});

describe('printCertificate', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('appends an off-screen iframe carrying the certificate html', () => {
    printCertificate('<div class="fbr-cert">Marker</div>', 'File Name');
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('aria-hidden')).toBe('true');
    expect(iframe?.srcdoc).toContain('<div class="fbr-cert">Marker</div>');
  });
});
