import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

interface RenderOptions {
  route?: string;
  path?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', path }: RenderOptions = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const content = path ? <Routes><Route path={path} element={ui} /></Routes> : ui;
  const result = render(
    <IntlProvider locale="en">
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
      </QueryClientProvider>
    </IntlProvider>,
  );
  return { ...result, queryClient };
}

export interface HttpClientMock {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
}

/**
 * Returns a fresh HTTP client mock and makes getAuthenticatedHttpClient return it.
 * The calling test file must declare `jest.mock('@edx/frontend-platform/auth')`.
 */
export function mockHttpClient(): HttpClientMock {
  const client: HttpClientMock = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  (getAuthenticatedHttpClient as jest.Mock).mockReturnValue(client);
  return client;
}
