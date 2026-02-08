import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { ResourceNotes } from '../../components/ResourceNotes';
import * as progressApi from '../../services/progress';

// Mock the progress API
vi.mock('../../services/progress', () => ({
  progressApi: {
    updateProgress: vi.fn(),
  },
}));

describe('ResourceNotes', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

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

  it('renders modal when isOpen is true', () => {
    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Resource Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Resource/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={null}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText(/Resource Notes/i)).not.toBeInTheDocument();
  });

  it('displays initial notes when provided', () => {
    const initialNotes = 'These are my initial notes';

    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={initialNotes}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByPlaceholderText(/Add notes about this resource/i);
    expect(textarea).toHaveValue(initialNotes);
  });

  it('shows character counter', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByPlaceholderText(/Add notes about this resource/i);
    await user.type(textarea, 'Test note');

    expect(screen.getByText(/1991 characters remaining/i)).toBeInTheDocument();
  });

  it('shows warning when approaching character limit', async () => {
    const longNotes = 'a'.repeat(1950); // 1950 chars, 50 remaining

    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={longNotes}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const remainingText = screen.getByText(/50 characters remaining/i);
    expect(remainingText).toHaveClass('text-yellow-600');
  });

  it('shows error when exceeding character limit', async () => {
    const tooLongNotes = 'a'.repeat(2100); // Over limit

    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={tooLongNotes}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const remainingText = screen.getByText(/-100 characters remaining/i);
    expect(remainingText).toHaveClass('text-red-600');

    const saveButton = screen.getByRole('button', { name: /Save Notes/i });
    expect(saveButton).toBeDisabled();
  });

  it('calls onClose when Cancel button is clicked', () => {
    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close X button is clicked', () => {
    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText(/Close/i);
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('saves notes and calls onClose on successful save', async () => {
    vi.mocked(progressApi.progressApi.updateProgress).mockResolvedValue({
      success: true,
      data: {
        id: 'entry-1',
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'in_progress',
        notes: 'Updated notes',
        timeSpent: null,
        startedAt: null,
        completedAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });

    const user = userEvent.setup();

    renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByPlaceholderText(/Add notes about this resource/i);
    await user.type(textarea, 'Updated notes');

    const saveButton = screen.getByRole('button', { name: /Save Notes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(progressApi.progressApi.updateProgress).toHaveBeenCalledWith(
        'plan-1',
        'resource-1',
        { notes: 'Updated notes' }
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('resets notes when modal is closed and reopened', async () => {
    const user = userEvent.setup();
    const initialNotes = 'Initial notes';

    const { rerender } = renderWithProvider(
      <ResourceNotes
        planId="plan-1"
        resourceId="resource-1"
        resourceTitle="Test Resource"
        initialNotes={initialNotes}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByPlaceholderText(/Add notes about this resource/i);
    await user.clear(textarea);
    await user.type(textarea, 'Modified notes');

    // Close modal
    rerender(
      <QueryClientProvider client={queryClient}>
        <ResourceNotes
          planId="plan-1"
          resourceId="resource-1"
          resourceTitle="Test Resource"
          initialNotes={initialNotes}
          isOpen={false}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    );

    // Reopen modal
    rerender(
      <QueryClientProvider client={queryClient}>
        <ResourceNotes
          planId="plan-1"
          resourceId="resource-1"
          resourceTitle="Test Resource"
          initialNotes={initialNotes}
          isOpen={true}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    );

    const textareaAfterReopen = screen.getByPlaceholderText(
      /Add notes about this resource/i
    );
    expect(textareaAfterReopen).toHaveValue(initialNotes);
  });
});
