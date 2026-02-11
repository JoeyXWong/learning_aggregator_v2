import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProgressDashboardPage } from '../../pages/ProgressDashboardPage';
import * as progressApi from '../../services/progress';

// Mock the progress API
vi.mock('../../services/progress', () => ({
  progressApi: {
    getOverallStats: vi.fn(),
    getPlanProgress: vi.fn(),
  },
}));

describe('ProgressDashboardPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (planId?: string) => {
    const path = planId ? `/progress/${planId}` : '/progress';
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/progress/:planId?" element={<ProgressDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders Progress Dashboard heading', () => {
    renderWithProviders();

    expect(screen.getByText('Progress Dashboard')).toBeInTheDocument();
  });

  it('renders Plan Progress heading when planId provided', () => {
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue({
      success: true,
      data: {
        planId: 'plan-1',
        progressEntries: [],
        summary: {
          totalResources: 0,
          completedCount: 0,
          inProgressCount: 0,
          notStartedCount: 0,
          totalTimeSpent: 0,
          completionPercentage: 0,
        },
      },
    });

    renderWithProviders('plan-1');

    expect(screen.getByText('Plan Progress')).toBeInTheDocument();
  });
});
