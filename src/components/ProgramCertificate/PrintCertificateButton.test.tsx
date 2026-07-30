import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintCertificateButton from './PrintCertificateButton';
import printCertificate from './printCertificate';

jest.mock('./printCertificate', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedPrint = printCertificate as jest.MockedFunction<typeof printCertificate>;

describe('PrintCertificateButton', () => {
  beforeEach(() => mockedPrint.mockClear());

  it('renders the default label', () => {
    render(<PrintCertificateButton html="<div/>" traineeName="A" programName="B" />);
    expect(screen.getByRole('button', { name: /Print \/ Save as PDF/i })).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<PrintCertificateButton html="<div/>" traineeName="A" programName="B" label="Print / PDF" />);
    expect(screen.getByRole('button', { name: /^Print \/ PDF$/i })).toBeInTheDocument();
  });

  it('prints with the html and the built filename on click', () => {
    render(<PrintCertificateButton html="<div class='fbr-cert'/>" traineeName="Jawad Ali" programName="Marker Program" />);
    fireEvent.click(screen.getByRole('button', { name: /Print/i }));
    expect(mockedPrint).toHaveBeenCalledWith("<div class='fbr-cert'/>", 'Jawad Ali - Marker Program - Certificate');
  });
});
