import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../pages/HomePage';
import * as topicsApi from '../../services/topics';
import * as plansApi from '../../services/plans';

// Mock the APIs
vi.mock('../../services/topics', () => ({
  topicsApi: {
    createTopic: vi.fn(),
    listTopics: vi.fn(),
  },
}));

vi.mock('../../services/plans', () => ({
  plansApi: {
    listPlans: vi.fn(),
  },
}));

describe('HomePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Mock default responses
    vi.mocked(topicsApi.topicsApi.listTopics).mockResolvedValue({
      success: true,
      data: { topics: [], count: 0 },
    });
    vi.mocked(plansApi.plansApi.listPlans).mockResolvedValue({
      success: true,
      data: { plans: [], count: 0 },
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders TopicSearch component', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText(/Search for Learning Resources/i)).toBeInTheDocument();
  });

  it('renders development progress section', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText(/Development Progress/i)).toBeInTheDocument();
  });

  it('renders phase status cards', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Phase 1')).toBeInTheDocument();
    expect(screen.getByText('Phase 2')).toBeInTheDocument();
    expect(screen.getByText('Phase 3')).toBeInTheDocument();
  });
});
