import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ProgressDashboard } from '../../components/ProgressDashboard';
import { progressApi } from '../../services/progress';

// Mock the progress API
vi.mock('../../services/progress', () => ({
  progressApi: {
    getOverallStats: vi.fn(),
    getPlanProgress: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProgressDashboard', () => {
  it('renders loading state initially', () => {
    vi.mocked(progressApi.getOverallStats).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ProgressDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/Loading progress data/i)).toBeInTheDocument();
  });

  it('renders overall stats when no planId provided', async () => {
    vi.mocked(progressApi.getOverallStats).mockResolvedValue({
      success: true,
      data: {
        totalPlans: 3,
        totalResources: 15,
        completedResources: 5,
        inProgressResources: 3,
        notStartedResources: 7,
        totalTimeSpent: 120,
        averageCompletionRate: 33.3,
        recentActivity: [
          {
            id: '1',
            planId: 'plan1',
            resourceTitle: 'Test Resource',
            status: 'completed',
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });

    render(<ProgressDashboard />, { wrapper: createWrapper() });

    expect(await screen.findByText(/Learning Statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Plans/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Completion/i)).toBeInTheDocument();
    const completionPercentages = screen.getAllByText('33%');
    expect(completionPercentages.length).toBeGreaterThan(0);
  });

  it('renders plan-specific progress when planId provided', async () => {
    vi.mocked(progressApi.getPlanProgress).mockResolvedValue({
      success: true,
      data: {
        planId: 'plan1',
        progressEntries: [],
        summary: {
          totalResources: 10,
          completedCount: 3,
          inProgressCount: 2,
          notStartedCount: 5,
          totalTimeSpent: 60,
          completionPercentage: 30,
        },
      },
    });

    render(<ProgressDashboard planId="plan1" />, { wrapper: createWrapper() });

    expect(await screen.findByText(/Plan Progress/i)).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    vi.mocked(progressApi.getOverallStats).mockRejectedValue(
      new Error('API Error')
    );

    render(<ProgressDashboard />, { wrapper: createWrapper() });

    expect(
      await screen.findByText(/Failed to load progress data/i)
    ).toBeInTheDocument();
  });

  it('renders recent activity with correct status badges', async () => {
    vi.mocked(progressApi.getOverallStats).mockResolvedValue({
      success: true,
      data: {
        totalPlans: 1,
        totalResources: 5,
        completedResources: 1,
        inProgressResources: 1,
        notStartedResources: 3,
        totalTimeSpent: 30,
        averageCompletionRate: 20,
        recentActivity: [
          {
            id: '1',
            planId: 'plan1',
            resourceTitle: 'Completed Resource',
            status: 'completed',
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            planId: 'plan1',
            resourceTitle: 'In Progress Resource',
            status: 'in_progress',
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });

    render(<ProgressDashboard />, { wrapper: createWrapper() });

    expect(await screen.findByText('Completed Resource')).toBeInTheDocument();
    expect(screen.getByText('In Progress Resource')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });
});
