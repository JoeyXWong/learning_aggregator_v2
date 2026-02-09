import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResourceList } from '../../components/ResourceList';
import * as topicsApi from '../../services/topics';

// Mock the topics API
vi.mock('../../services/topics', () => ({
  topicsApi: {
    getTopicResources: vi.fn(),
  },
}));

describe('ResourceList', () => {
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

  const mockResourcesResponse = {
    success: true,
    data: {
      topicId: 'topic-1',
      totalCount: 2,
      filters: {},
      resources: [
        {
          id: 'resource-1',
          title: 'React Testing Library Guide',
          description: 'Comprehensive guide to testing React apps',
          url: 'https://example.com/1',
          type: 'article',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'Medium',
          duration: 15,
          rating: 4.5,
          viewCount: 1000,
          qualityScore: 85,
          thumbnailUrl: null,
          createdAt: '2024-01-01',
        },
        {
          id: 'resource-2',
          title: 'Advanced React Patterns',
          description: 'Learn advanced React patterns',
          url: 'https://example.com/2',
          type: 'video',
          difficulty: 'advanced',
          pricing: 'premium',
          platform: 'YouTube',
          duration: 45,
          rating: 4.8,
          viewCount: 5000,
          qualityScore: 92,
          thumbnailUrl: null,
          createdAt: '2024-01-02',
        },
      ],
      groupedByType: {},
      metadata: {
        types: [
          { type: 'article', count: 1 },
          { type: 'video', count: 1 },
        ],
        difficulties: [
          { value: 'beginner', count: 1 },
          { value: 'advanced', count: 1 },
        ],
        pricing: [
          { value: 'free', count: 1 },
          { value: 'premium', count: 1 },
        ],
      },
    },
  };

  it('shows loading state while fetching data', () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    const { container } = renderWithProvider(<ResourceList topicId="topic-1" />);

    expect(screen.getByText(/Loading resources.../i)).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockRejectedValue(
      new Error('Failed to fetch')
    );

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load resources/i)).toBeInTheDocument();
    });
  });

  it('renders resources after successful fetch', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText('React Testing Library Guide')).toBeInTheDocument();
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
    });
  });

  it('renders resource badges correctly', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText('article')).toBeInTheDocument();
      expect(screen.getByText('video')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
      expect(screen.getByText('advanced')).toBeInTheDocument();
    });
  });

  it('displays resource count', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      // Look for the count specifically
      const countElements = screen.getAllByText('2');
      expect(countElements.length).toBeGreaterThan(0);
    });
  });

  it('renders filter controls', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    const { container } = renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      const selects = container.querySelectorAll('select');
      expect(selects.length).toBe(3);
    });

    // Verify the filter labels exist
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('filter controls update query on change', async () => {
    const user = userEvent.setup();
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    const { container } = renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText('Type')).toBeInTheDocument();
    });

    // Initial call with empty filters
    expect(topicsApi.topicsApi.getTopicResources).toHaveBeenCalledWith('topic-1', {
      type: '',
      difficulty: '',
      pricing: '',
    });

    // Change type filter (first select)
    const selects = container.querySelectorAll('select');
    const typeSelect = selects[0];
    await user.selectOptions(typeSelect, 'video');

    await waitFor(() => {
      expect(topicsApi.topicsApi.getTopicResources).toHaveBeenCalledWith('topic-1', {
        type: 'video',
        difficulty: '',
        pricing: '',
      });
    });
  });

  it('shows empty state with clear filters button when no resources match', async () => {
    const emptyResponse = {
      ...mockResourcesResponse,
      data: {
        ...mockResourcesResponse.data,
        resources: [],
        totalCount: 0,
      },
    };

    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(emptyResponse);

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText(/No resources match your filters/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();
    });
  });

  it('clear filters button resets all filters', async () => {
    const user = userEvent.setup();
    const emptyResponse = {
      ...mockResourcesResponse,
      data: {
        ...mockResourcesResponse.data,
        resources: [],
        totalCount: 0,
      },
    };

    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(emptyResponse);

    const { container } = renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText(/No resources match your filters/i)).toBeInTheDocument();
    });

    // Set some filters first
    const selects = container.querySelectorAll('select');
    const typeSelect = selects[0];
    await user.selectOptions(typeSelect, 'video');

    // Click clear filters
    const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
    await user.click(clearButton);

    // Should call with empty filters
    await waitFor(() => {
      expect(topicsApi.topicsApi.getTopicResources).toHaveBeenLastCalledWith('topic-1', {
        type: '',
        difficulty: '',
        pricing: '',
      });
    });
  });

  it('renders resource cards with View Resource links', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      const links = screen.getAllByText(/View Resource/i);
      expect(links).toHaveLength(2);
      expect(links[0].closest('a')).toHaveAttribute('href', 'https://example.com/1');
      expect(links[1].closest('a')).toHaveAttribute('href', 'https://example.com/2');
    });
  });

  it('displays quality scores', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('92/100')).toBeInTheDocument();
    });
  });

  it('displays duration when available', async () => {
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue(
      mockResourcesResponse
    );

    renderWithProvider(<ResourceList topicId="topic-1" />);

    await waitFor(() => {
      expect(screen.getByText(/15 min/i)).toBeInTheDocument();
      expect(screen.getByText(/45 min/i)).toBeInTheDocument();
    });
  });
});
