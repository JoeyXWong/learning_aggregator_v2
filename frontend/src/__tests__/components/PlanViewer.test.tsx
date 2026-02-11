import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanViewer } from '../../components/PlanViewer';
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

describe('PlanViewer', () => {
  let queryClient: QueryClient;
  const mockOnBack = vi.fn();

  const mockPlan = {
    success: true,
    data: {
      id: 'plan-1',
      topicId: 'topic-1',
      title: 'React Learning Path',
      preferences: {
        freeOnly: true,
        pace: 'moderate' as const,
        preferredTypes: ['video', 'article'],
      },
      phases: [
        {
          name: 'Foundation',
          description: 'Learn the basics',
          order: 1,
          estimatedHours: 10,
          resources: [
            {
              resourceId: 'res-1',
              title: 'React Basics',
              url: 'https://example.com/1',
              type: 'video',
              difficulty: 'beginner',
              duration: 30,
              reason: 'Great introduction',
            },
          ],
        },
        {
          name: 'Advanced',
          description: 'Deep dive',
          order: 2,
          estimatedHours: 20,
          resources: [
            {
              resourceId: 'res-2',
              title: 'Advanced Patterns',
              url: 'https://example.com/2',
              type: 'article',
              difficulty: 'advanced',
              duration: 45,
              reason: 'Comprehensive guide',
            },
          ],
        },
      ],
      totalDuration: 30,
      completionPercentage: 25,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  };

  const mockProgress = {
    success: true,
    data: {
      planId: 'plan-1',
      progressEntries: [
        {
          id: 'entry-1',
          planId: 'plan-1',
          resourceId: 'res-1',
          status: 'completed' as const,
          notes: 'Great resource!',
          timeSpent: 30,
          startedAt: '2024-01-01',
          completedAt: '2024-01-01',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      summary: {
        totalResources: 2,
        completedCount: 1,
        inProgressCount: 0,
        notStartedCount: 1,
        totalTimeSpent: 30,
        completionPercentage: 50,
      },
    },
  };

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

  it('shows loading state while fetching plan', () => {
    vi.mocked(plansApi.plansApi.getPlan).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    expect(screen.getByText(/Loading learning plan.../i)).toBeInTheDocument();
  });

  it('shows error state with back button on failure', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockRejectedValue(new Error('Failed'));
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load learning plan/i)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Go Back/i });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('renders plan header with title and metadata', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('React Learning Path')).toBeInTheDocument();
    });

    // Check for metadata using getAllByText since numbers may appear multiple times
    const durationText = screen.getAllByText(/30 hours/i);
    expect(durationText.length).toBeGreaterThan(0);
  });

  it('renders preferences badges', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Free Resources Only/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Pace: moderate/i)).toBeInTheDocument();
    expect(screen.getByText(/Types: video, article/i)).toBeInTheDocument();
  });

  it('phase accordion expands and collapses', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Foundation')).toBeInTheDocument();
    });

    // First phase should be expanded by default
    expect(screen.getByText('React Basics')).toBeInTheDocument();

    // Second phase should be collapsed
    expect(screen.queryByText('Advanced Patterns')).not.toBeInTheDocument();

    // Click to expand second phase
    const advancedPhaseButton = screen.getByText('Advanced').closest('button');
    if (advancedPhaseButton) {
      fireEvent.click(advancedPhaseButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Advanced Patterns')).toBeInTheDocument();
    });
  });

  it('displays resource items with badges', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    // Check for resource metadata badges (may appear multiple times)
    expect(screen.getAllByText('video').length).toBeGreaterThan(0);
    expect(screen.getAllByText('beginner').length).toBeGreaterThan(0);
  });

  it('export button renders', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('React Learning Path')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', {
      name: /Export as Markdown/i,
    });
    expect(exportButton).toBeInTheDocument();
  });

  it('delete button shows confirmation and calls onBack on success', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(plansApi.plansApi.deletePlan).mockResolvedValue({
      success: true,
      message: 'Deleted',
    });
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    // Mock window.confirm
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('React Learning Path')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete Plan/i });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this learning plan?'
    );

    await waitFor(() => {
      expect(plansApi.plansApi.deletePlan).toHaveBeenCalledWith('plan-1');
      expect(mockOnBack).toHaveBeenCalled();
    });

    mockConfirm.mockRestore();
  });

  it('delete button does not delete if user cancels confirmation', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    // Mock window.confirm to return false
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('React Learning Path')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete Plan/i });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(plansApi.plansApi.deletePlan).not.toHaveBeenCalled();

    mockConfirm.mockRestore();
  });

  it('back button in header calls onBack', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('React Learning Path')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('renders phase information correctly', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Foundation')).toBeInTheDocument();
    });

    expect(screen.getByText('Learn the basics')).toBeInTheDocument();

    // Phase metadata
    const hoursText = screen.getAllByText(/10 hours/i);
    expect(hoursText.length).toBeGreaterThan(0);
  });

  it('displays tip footer', async () => {
    vi.mocked(plansApi.plansApi.getPlan).mockResolvedValue(mockPlan);
    vi.mocked(progressApi.progressApi.getPlanProgress).mockResolvedValue(mockProgress);

    renderWithProvider(<PlanViewer planId="plan-1" onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Tip:/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Follow the phases in order for the best learning experience/i)
    ).toBeInTheDocument();
  });
});
