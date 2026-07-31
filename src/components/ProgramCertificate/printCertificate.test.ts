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

  it('sets document.title to the filename while printing and restores it after', async () => {
    document.title = 'Studio Tab';
    const print = jest.fn();
    const listeners: Record<string, () => void> = {};
    // jsdom does not render srcdoc iframes, so stub the frame window/document.
    const frameWindow = {
      print,
      focus: jest.fn(),
      addEventListener: (event: string, handler: () => void) => { listeners[event] = handler; },
    } as unknown as Window;
    const frameDoc = { images: [], fonts: undefined } as unknown as Document;
    jest.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue(frameWindow);
    jest.spyOn(HTMLIFrameElement.prototype, 'contentDocument', 'get').mockReturnValue(frameDoc);

    printCertificate('<div class="fbr-cert">X</div>', 'File Name');
    // jsdom fires the srcdoc iframe's load itself; drive the flow off that single
    // load (dispatching our own as well would run the handler twice).
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    expect(print).toHaveBeenCalled();
    expect(document.title).toBe('File Name');
    listeners.afterprint(); // Chrome fires this on print or cancel
    expect(document.title).toBe('Studio Tab');
  });
});
