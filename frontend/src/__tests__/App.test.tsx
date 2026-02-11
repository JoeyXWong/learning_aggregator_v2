import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import * as api from '../services/api';

// Mock all pages to avoid deep rendering
vi.mock('../pages/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">Home Page</div>,
}));
vi.mock('../pages/ResourcesPage', () => ({
  ResourcesPage: () => <div>Resources Page</div>,
}));
vi.mock('../pages/PlanGeneratorPage', () => ({
  PlanGeneratorPage: () => <div>Plan Generator Page</div>,
}));
vi.mock('../pages/PlanViewerPage', () => ({
  PlanViewerPage: () => <div>Plan Viewer Page</div>,
}));
vi.mock('../pages/ProgressDashboardPage', () => ({
  ProgressDashboardPage: () => <div>Progress Dashboard Page</div>,
}));
vi.mock('../pages/NotFoundPage', () => ({
  NotFoundPage: () => <div>Not Found Page</div>,
}));

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('App', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(api.api.get).mockResolvedValue({ data: { success: true } });
  });

  const renderApp = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

  it('renders header with app title', () => {
    renderApp();

    expect(screen.getByText('Learning Aggregator V2')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderApp();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('renders footer', () => {
    renderApp();

    expect(
      screen.getByText(/Built with React, TypeScript, Express, and Prisma/)
    ).toBeInTheDocument();
  });

  it('shows API status indicator', () => {
    renderApp();

    expect(screen.getByText(/checking/i)).toBeInTheDocument();
  });

  it('renders home page by default', () => {
    renderApp();

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});
