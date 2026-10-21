import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CalendarPdfDownloadButton from './CalendarPdfDownloadButton';
import { CalendarPdfDownloadButtonProps, CalendarSession } from './types';

// The renderer is loaded lazily on click and is heavy; the factory stands in for
// it so the test asserts what we hand the renderer rather than running a real
// PDF build. `virtual` keeps the suite independent of the install step.
const mockToBlob = jest.fn(() => Promise.resolve(new Blob(['%PDF-'], { type: 'application/pdf' })));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockPdf = jest.fn((_document: React.ReactElement) => ({ toBlob: mockToBlob }));
jest.mock('@react-pdf/renderer', () => ({
  __esModule: true,
  pdf: (document: React.ReactElement) => mockPdf(document),
  Document: 'Document',
  Page: 'Page',
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: (styles: unknown) => styles },
}), { virtual: true });

const session = (overrides: Partial<CalendarSession> = {}): CalendarSession => ({
  id: 1,
  title: 'Income Tax Audit',
  course_name: 'Customs & Excise Enforcement',
  instructor_names: ['Sara Khan'],
  location: { id: 'l1', name: 'Lahore Hall A' },
  session_type: 'lecture',
  status: 'scheduled',
  scheduled_start_time: '2026-03-02T09:00:00Z',
  scheduled_end_time: '2026-03-02T10:30:00Z',
  ...overrides,
});

const renderButton = (props: Partial<CalendarPdfDownloadButtonProps> = {}) => render(
  <CalendarPdfDownloadButton
    sessions={[session()]}
    rangeLabel="Mar 1 – Mar 7, 2026"
    viewLabel="Week"
    programName="2026-B Programme"
    sessionTypeLabels={{ lecture: 'Lecture' }}
    {...props}
  />,
);

const renderedModel = () => mockPdf.mock.calls[0][0].props.model;

describe('CalendarPdfDownloadButton', () => {
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let click: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    createObjectURL = jest.fn(() => 'blob:calendar');
    revokeObjectURL = jest.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;
    click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => { click.mockRestore(); });

  it('renders an accessible download control', () => {
    renderButton();
    const button = screen.getByRole('button', { name: /download the mar 1 – mar 7, 2026 timetable as a pdf/i });
    expect(button).toBeEnabled();
  });

  it('is disabled with an explanatory name when the range has no sessions', () => {
    renderButton({ sessions: [] });
    const button = screen.getByRole('button', { name: /no sessions in this period to download/i });
    expect(button).toBeDisabled();
  });

  it('builds the document from the calendar sessions and starts a download', async () => {
    renderButton();
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(mockPdf).toHaveBeenCalled());
    const model = renderedModel();
    expect(model.sessionCount).toBe(1);
    expect(model.rangeLabel).toBe('Mar 1 – Mar 7, 2026');
    expect(model.programName).toBe('2026-B Programme');
    expect(model.days[0].rows[0]).toMatchObject({
      title: 'Income Tax Audit',
      course: 'Customs & Excise Enforcement',
      instructors: 'Sara Khan',
      location: 'Lahore Hall A',
      type: 'Lecture',
    });

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:calendar');
  });

  it('names the file after the visible range', async () => {
    renderButton();
    const anchors: Node[] = [];
    const append = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      anchors.push(node);
      return node;
    });
    jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect((anchors[anchors.length - 1] as HTMLAnchorElement).download).toBe('calendar-mar-1-mar-7-2026.pdf');
    append.mockRestore();
  });

  it('groups a week of sessions across several days', async () => {
    renderButton({
      sessions: [
        session({ id: 1, scheduled_start_time: '2026-03-02T09:00:00Z' }),
        session({ id: 2, scheduled_start_time: '2026-03-03T09:00:00Z' }),
        session({ id: 3, scheduled_start_time: '2026-03-04T09:00:00Z' }),
      ],
    });
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(mockPdf).toHaveBeenCalled());
    const model = renderedModel();
    expect(model.days).toHaveLength(3);
    expect(model.sessionCount).toBe(3);
  });

  it('surfaces a message when generation fails, and recovers', async () => {
    mockToBlob.mockRejectedValueOnce(new Error('boom'));
    renderButton();
    await userEvent.click(screen.getByRole('button'));

    expect(await screen.findByText(/could not generate the pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
    expect(click).not.toHaveBeenCalled();
  });
});
