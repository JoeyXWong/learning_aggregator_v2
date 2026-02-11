import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicSearch } from '../../components/TopicSearch';
import * as topicsApi from '../../services/topics';

// Mock the topics API
vi.mock('../../services/topics', () => ({
  topicsApi: {
    createTopic: vi.fn(),
  },
}));

describe('TopicSearch', () => {
  let queryClient: QueryClient;
  const mockOnTopicCreated = vi.fn();

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

  it('renders form with input field and submit button', () => {
    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    expect(screen.getByLabelText(/Topic Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Find Resources/i })).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is enabled when input has text', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const input = screen.getByLabelText(/Topic Name/i);
    await user.type(input, 'React Testing');

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows loading state during mutation', async () => {
    const user = userEvent.setup();
    vi.mocked(topicsApi.topicsApi.createTopic).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const input = screen.getByLabelText(/Topic Name/i);
    await user.type(input, 'React Testing');

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Finding Resources.../i)).toBeInTheDocument();
    });
  });

  it('calls onTopicCreated callback on success', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      data: {
        topicId: 'topic-123',
        resourceCount: 15,
        sources: { youtube: 8, github: 7 },
        averageQualityScore: 85.5,
      },
    };

    vi.mocked(topicsApi.topicsApi.createTopic).mockResolvedValue(mockResponse);

    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const input = screen.getByLabelText(/Topic Name/i);
    await user.type(input, 'React Testing');

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnTopicCreated).toHaveBeenCalledWith('topic-123');
    });
  });

  it('shows error message on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(topicsApi.topicsApi.createTopic).mockRejectedValue(
      new Error('Network error')
    );

    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const input = screen.getByLabelText(/Topic Name/i);
    await user.type(input, 'React Testing');

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows success message with resource count', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      data: {
        topicId: 'topic-123',
        resourceCount: 25,
        sources: { youtube: 15, github: 10 },
        averageQualityScore: 92.3,
      },
    };

    vi.mocked(topicsApi.topicsApi.createTopic).mockResolvedValue(mockResponse);

    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const input = screen.getByLabelText(/Topic Name/i);
    await user.type(input, 'React Testing');

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Success!/i)).toBeInTheDocument();
      expect(screen.getByText(/Found 25 resources/i)).toBeInTheDocument();
      expect(screen.getByText(/92.3\/100/i)).toBeInTheDocument();
    });
  });

  it('toggles advanced options section', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const toggleButton = screen.getByRole('button', { name: /Advanced Options/i });
    await user.click(toggleButton);

    expect(screen.getByText(/Max Resources per Source:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include YouTube/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include GitHub/i)).toBeInTheDocument();

    await user.click(toggleButton);
    expect(screen.queryByText(/Max Resources per Source:/i)).not.toBeInTheDocument();
  });

  it('sends options when advanced options are shown', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      data: {
        topicId: 'topic-123',
        resourceCount: 10,
        sources: { youtube: 5, github: 5 },
        averageQualityScore: 80,
      },
    };

    vi.mocked(topicsApi.topicsApi.createTopic).mockResolvedValue(mockResponse);

    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const input = screen.getByLabelText(/Topic Name/i);
    await user.type(input, 'React Testing');

    // Open advanced options
    const toggleButton = screen.getByRole('button', { name: /Advanced Options/i });
    await user.click(toggleButton);

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(topicsApi.topicsApi.createTopic).toHaveBeenCalledWith({
        name: 'React Testing',
        options: {
          maxResourcesPerSource: 20,
          includeYouTube: true,
          includeGitHub: true,
          minQualityScore: 30,
        },
      });
    });
  });

  it('does not send options when advanced options are hidden', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      data: {
        topicId: 'topic-123',
        resourceCount: 10,
        sources: { youtube: 5, github: 5 },
        averageQualityScore: 80,
      },
    };

    vi.mocked(topicsApi.topicsApi.createTopic).mockResolvedValue(mockResponse);

    renderWithProvider(<TopicSearch onTopicCreated={mockOnTopicCreated} />);

    const input = screen.getByLabelText(/Topic Name/i);
    await user.type(input, 'React Testing');

    const submitButton = screen.getByRole('button', { name: /Find Resources/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(topicsApi.topicsApi.createTopic).toHaveBeenCalledWith({
        name: 'React Testing',
        options: undefined,
      });
    });
  });
});
