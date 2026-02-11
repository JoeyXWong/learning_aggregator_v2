import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PlanViewerPage } from '../../pages/PlanViewerPage';
import * as plansApi from '../../services/plans';
import * as progressApi from '../../services/progress';

// Mock the APIs
vi.mock('../../services/plans', () => ({
  plansApi: {
    getPlan: vi.fn(),
    deletePlan: vi.fn(),
    exportPlan: vi.fn(),
  },
}));

vi.mock('../../services/progress', () => ({
  progressApi: {
    getPlanProgress: vi.fn(),
    updateProgress: vi.fn(),
    createProgress: vi.fn(),
  },
}));

describe('PlanViewerPage', () => {
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
    const path = planId ? `/view/${planId}` : '/view/';
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/view/:planId" element={<PlanViewerPage />} />
            <Route path="/view/" element={<PlanViewerPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders PlanViewer with planId from route', () => {
    vi.mocked(plansApi.plansApi.getPlan).mockReturnValue(
      new Promise(() => {}) // Never resolves (shows loading)
    );
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

    expect(screen.getByText(/Loading learning plan.../i)).toBeInTheDocument();
  });

  it('shows error when planId is missing', () => {
    renderWithProviders(undefined);

    expect(screen.getByText(/Invalid plan ID/i)).toBeInTheDocument();
  });
});
