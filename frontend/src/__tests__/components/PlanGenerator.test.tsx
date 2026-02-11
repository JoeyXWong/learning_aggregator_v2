import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanGenerator } from '../../components/PlanGenerator';
import * as plansApi from '../../services/plans';

// Mock the plans API
vi.mock('../../services/plans', () => ({
  plansApi: {
    generatePlan: vi.fn(),
  },
}));

describe('PlanGenerator', () => {
  let queryClient: QueryClient;
  const mockOnPlanGenerated = vi.fn();

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

  const mockPlanResponse = {
    success: true,
    data: {
      id: 'plan-123',
      topicId: 'topic-1',
      title: 'React Learning Plan',
      preferences: { pace: 'moderate' as const, freeOnly: false },
      phases: [],
      totalDuration: 40,
      completionPercentage: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  };

  it('renders form with pace selection buttons', () => {
    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    expect(screen.getByRole('heading', { name: /Generate Learning Plan/i })).toBeInTheDocument();
    expect(screen.getByText('casual')).toBeInTheDocument();
    expect(screen.getByText('moderate')).toBeInTheDocument();
    expect(screen.getByText('intensive')).toBeInTheDocument();
  });

  it('toggles freeOnly checkbox', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    const checkbox = screen.getByLabelText(/Free Resources Only/i);
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('pace buttons change selection', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    // Find pace buttons by their content (they're not aria-labeled)
    const buttons = screen.getAllByRole('button');
    const casualButton = buttons.find(btn => btn.textContent?.includes('casual'));
    const moderateButton = buttons.find(btn => btn.textContent?.includes('moderate'));

    expect(casualButton).toBeDefined();
    expect(moderateButton).toBeDefined();

    // Moderate should be selected by default
    expect(moderateButton).toHaveClass('border-indigo-600');

    if (casualButton) {
      await user.click(casualButton);
      expect(casualButton).toHaveClass('border-indigo-600');
    }
  });

  it('resource type checkboxes can be toggled', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    const videoCheckbox = screen.getByRole('checkbox', { name: /Videos/i });
    expect(videoCheckbox).not.toBeChecked();

    await user.click(videoCheckbox);
    expect(videoCheckbox).toBeChecked();

    await user.click(videoCheckbox);
    expect(videoCheckbox).not.toBeChecked();
  });

  it('calls generatePlan with correct data on submit', async () => {
    vi.mocked(plansApi.plansApi.generatePlan).mockResolvedValue(mockPlanResponse);

    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    const submitButton = screen.getByRole('button', {
      name: /Generate Learning Plan/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(plansApi.plansApi.generatePlan).toHaveBeenCalledWith({
        topicId: 'topic-1',
        preferences: {
          freeOnly: false,
          pace: 'moderate',
          preferredTypes: [],
        },
      });
    });
  });

  it('calls onPlanGenerated on successful generation', async () => {
    vi.mocked(plansApi.plansApi.generatePlan).mockResolvedValue(mockPlanResponse);

    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    const submitButton = screen.getByRole('button', {
      name: /Generate Learning Plan/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnPlanGenerated).toHaveBeenCalledWith('plan-123');
    });
  });

  it('shows loading state during generation', async () => {
    vi.mocked(plansApi.plansApi.generatePlan).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    const submitButton = screen.getByRole('button', {
      name: /Generate Learning Plan/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Generating Plan.../i)).toBeInTheDocument();
    });

    expect(screen.getByText(/This typically takes 15-25 seconds/i)).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    vi.mocked(plansApi.plansApi.generatePlan).mockRejectedValue(
      new Error('Generation failed')
    );

    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    const submitButton = screen.getByRole('button', {
      name: /Generate Learning Plan/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to generate learning plan/i)
      ).toBeInTheDocument();
    });
  });

  it('disables submit button during generation', async () => {
    vi.mocked(plansApi.plansApi.generatePlan).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    const submitButton = screen.getByRole('button', {
      name: /Generate Learning Plan/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('sends selected preferences with request', async () => {
    const user = userEvent.setup();
    vi.mocked(plansApi.plansApi.generatePlan).mockResolvedValue(mockPlanResponse);

    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    // Toggle free only
    const freeOnlyCheckbox = screen.getByLabelText(/Free Resources Only/i);
    await user.click(freeOnlyCheckbox);

    // Select intensive pace
    const buttons = screen.getAllByRole('button');
    const intensiveButton = buttons.find(btn => btn.textContent?.includes('intensive'));
    if (intensiveButton) {
      await user.click(intensiveButton);
    }

    // Select video and article types
    const videoCheckbox = screen.getByRole('checkbox', { name: /Videos/i });
    const articleCheckbox = screen.getByRole('checkbox', { name: /Articles/i });
    await user.click(videoCheckbox);
    await user.click(articleCheckbox);

    const submitButton = screen.getByRole('button', {
      name: /Generate Learning Plan/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(plansApi.plansApi.generatePlan).toHaveBeenCalledWith({
        topicId: 'topic-1',
        preferences: {
          freeOnly: true,
          pace: 'intensive',
          preferredTypes: ['video', 'article'],
        },
      });
    });
  });

  it('displays info box about how it works', () => {
    renderWithProvider(
      <PlanGenerator topicId="topic-1" onPlanGenerated={mockOnPlanGenerated} />
    );

    expect(screen.getByText(/How it works/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We'll analyze the resources we found/i)
    ).toBeInTheDocument();
  });
});
