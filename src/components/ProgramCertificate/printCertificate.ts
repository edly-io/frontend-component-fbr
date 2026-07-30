// Print a backend-rendered certificate as an isolated PDF page.
//
// The on-screen certificate is a fixed 1123×710 design scaled to fit its
// container (settings preview / modal); printing it in place fights the host's
// chrome, the modal's fixed/scrolled layer, and Studio's page layout. Instead
// we write the certificate into a throwaway, off-screen <iframe> and print that
// document alone. It carries its own `@page` size, so the output is pixel-exact
// and neither disturbed by nor leaked onto the surrounding app.

// A4 landscape is 297mm wide — exactly the native 1123px design width at 96dpi.
// We use the named size + orientation keyword (not explicit "297mm 188mm")
// because Firefox honours named landscape sizes on print but ignores explicit
// millimetre @page dimensions, which left the certificate on a portrait page
// and clipped its right edge.
// The certificate design is 297×188mm but A4 landscape is 297×210mm, so the
// document is stretched to fill the page height (the extra ~22mm is absorbed by
// the certificate's empty watermark area) — otherwise a blank strip shows below
// it. Width already matches (297mm), so only the height needs to fill.
// The `box-sizing: border-box` reset is essential: this iframe has no CSS reset
// (unlike the MFE page, where Paragon resets it), so it would default to
// content-box and `.fbr-cert__content { height: 100%; padding }` would overflow
// the certificate by its padding — clipping the bottom line (the signatory
// designation). The reset makes the print layout match the on-screen render.
const PRINT_DOC_STYLE = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  @page { size: A4 landscape; margin: 0; }
  .fbr-cert {
    transform: none !important;
    box-shadow: none !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

const escapeHtml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const buildPrintDocument = (certificateHtml: string, title: string): string => (
  '<!doctype html><html><head><meta charset="utf-8">'
  + `<title>${escapeHtml(title)}</title>`
  + `<style>${PRINT_DOC_STYLE}</style></head>`
  + `<body>${certificateHtml}</body></html>`
);

const printCertificate = (certificateHtml: string, title: string): void => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  // Off-screen but still rendered — `display:none` suppresses printing in some
  // browsers, so keep it in the layout at zero size.
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  iframe.srcdoc = buildPrintDocument(certificateHtml, title);
  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!frameWindow || !doc) {
      iframe.remove();
      return;
    }
    // afterprint fires on both print and cancel in modern browsers.
    frameWindow.addEventListener('afterprint', () => iframe.remove(), { once: true });
    const runPrint = () => {
      frameWindow.focus(); // Safari prints the focused frame.
      frameWindow.print();
    };
    // Wait for images AND fonts before printing. The logos, watermark and
    // signatures are cross-origin backend images loaded into this fresh
    // document; Firefox fires print() before they finish and drops them from
    // the PDF, so we explicitly await each image's load + decode (and
    // @font-face) first. Broken/errored images resolve so print never hangs.
    const imagesReady = Array.from(doc.images).map((img) => {
      const loaded = img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      return loaded.then(() => img.decode?.().catch(() => {}));
    });
    const fontsReady = doc.fonts?.ready ?? Promise.resolve();
    Promise.all([...imagesReady, fontsReady]).then(runPrint).catch(runPrint);
  };
  document.body.appendChild(iframe);
};

export default printCertificate;
