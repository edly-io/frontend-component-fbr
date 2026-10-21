import React, { useState } from 'react';
import { Button, Spinner } from '@openedx/paragon';
import { Download } from '@openedx/paragon/icons';
import { buildCalendarPdfModel, buildPdfFilename } from './calendarPdfData';
import { CalendarPdfDownloadButtonProps, CalendarPdfModel } from './types';

const GENERATION_ERROR = 'Could not generate the PDF. Please try again.';

/**
 * Render the model with the lazily loaded renderer. @react-pdf/renderer and its
 * font/layout engine are a large bundle, so they load on first click rather
 * than at module load; the calendar page itself carries none of that weight.
 */
const renderPdfBlob = async (model: CalendarPdfModel): Promise<Blob> => {
  const [{ pdf }, { default: CalendarPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./CalendarPdfDocument'),
  ]);
  return pdf(<CalendarPdfDocument model={model} />).toBlob();
};

/** Same anchor-click download the attendance export uses. */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/** Downloads the sessions currently in view as a timetable PDF. */
const CalendarPdfDownloadButton = ({
  sessions, rangeLabel, viewLabel = '', programName = '', sessionTypeLabels = {},
}: CalendarPdfDownloadButtonProps) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const hasSessions = sessions.length > 0;

  const handleDownload = async () => {
    setGenerating(true);
    setError('');
    try {
      const model = buildCalendarPdfModel({
        sessions, rangeLabel, viewLabel, programName, sessionTypeLabels,
      });
      downloadBlob(await renderPdfBlob(model), buildPdfFilename(rangeLabel));
    } catch (err) {
      setError(GENERATION_ERROR);
    } finally {
      setGenerating(false);
    }
  };

  const label = hasSessions
    ? `Download the ${rangeLabel} timetable as a PDF`
    : 'No sessions in this period to download';

  return (
    <>
      <Button
        variant="outline-primary"
        size="sm"
        iconBefore={generating ? undefined : Download}
        onClick={handleDownload}
        disabled={!hasSessions || generating}
        aria-label={label}
        title={label}
        aria-busy={generating}
      >
        {generating && (
          <Spinner animation="border" size="sm" className="mr-2" screenReaderText="Generating PDF" />
        )}
        {generating ? 'Preparing PDF…' : 'Download PDF'}
      </Button>
      {/* Progress is announced without moving focus away from the button. The
          failure message is visible and announced by its own live region, so it
          is not repeated here. */}
      <span className="sr-only" role="status" aria-live="polite">
        {generating ? 'Generating the timetable PDF' : ''}
      </span>
      {error && <span className="text-danger small ml-2" role="alert">{error}</span>}
    </>
  );
};

export default CalendarPdfDownloadButton;
