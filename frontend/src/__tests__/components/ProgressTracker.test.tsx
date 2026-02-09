import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressTracker } from '../../components/ProgressTracker';
import { type PlanResource } from '../../services/plans';
import * as progressApi from '../../services/progress';

// Mock the progress API
vi.mock('../../services/progress', () => ({
  progressApi: {
    getPlanProgress: vi.fn(),
    createProgress: vi.fn(),
  },
}));

describe('ProgressTracker', () => {
  const mockResources: PlanResource[] = [
    {
      resourceId: 'resource-1',
      title: 'Test Resource 1',
      url: 'https://example.com/1',
      type: 'video',
      difficulty: 'beginner',
      duration: 30,
      reason: 'Great intro',
    },
    {
      resourceId: 'resource-2',
      title: 'Test Resource 2',
      url: 'https://example.com/2',
      type: 'article',
      difficulty: 'intermediate',
      duration: 15,
      reason: 'Deep dive',
    },
  ];

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

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('renders progress bar with 0% when no progress data', async () => {
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue({
      success: true,
      data: {
        planId: 'plan-1',
        progressEntries: [],
        summary: {
          totalResources: 2,
          completedCount: 0,
          inProgressCount: 0,
          notStartedCount: 2,
          totalTimeSpent: 0,
          completionPercentage: 0,
        },
      },
    });

    renderWithProvider(
      <ProgressTracker planId="plan-1" resources={mockResources} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Overall Progress/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/0 \/ 2 completed \(0%\)/i)).toBeInTheDocument();
  });

  it('renders progress bar with correct completion percentage', async () => {
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue({
      success: true,
      data: {
        planId: 'plan-1',
        progressEntries: [
          {
            id: 'entry-1',
            planId: 'plan-1',
            resourceId: 'resource-1',
            status: 'completed',
            notes: null,
            timeSpent: null,
            startedAt: null,
            completedAt: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        summary: {
          totalResources: 2,
          completedCount: 1,
          inProgressCount: 0,
          notStartedCount: 1,
          totalTimeSpent: 0,
          completionPercentage: 50,
        },
      },
    });

    renderWithProvider(
      <ProgressTracker planId="plan-1" resources={mockResources} />
    );

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 2 completed \(50%\)/i)).toBeInTheDocument();
    });
  });

  it('displays status summary correctly', async () => {
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue({
      success: true,
      data: {
        planId: 'plan-1',
        progressEntries: [
          {
            id: 'entry-1',
            planId: 'plan-1',
            resourceId: 'resource-1',
            status: 'completed',
            notes: null,
            timeSpent: null,
            startedAt: null,
            completedAt: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'entry-2',
            planId: 'plan-1',
            resourceId: 'resource-2',
            status: 'in_progress',
            notes: null,
            timeSpent: null,
            startedAt: null,
            completedAt: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        summary: {
          totalResources: 3,
          completedCount: 1,
          inProgressCount: 1,
          notStartedCount: 1,
          totalTimeSpent: 0,
          completionPercentage: 33,
        },
      },
    });

    renderWithProvider(
      <ProgressTracker planId="plan-1" resources={mockResources} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Not Started: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/In Progress: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed: 1/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    vi.mocked(progressApi.progressApi.getPlanProgress).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    const { container } = renderWithProvider(
      <ProgressTracker planId="plan-1" resources={mockResources} />
    );

    // Check for loading spinner by class
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
