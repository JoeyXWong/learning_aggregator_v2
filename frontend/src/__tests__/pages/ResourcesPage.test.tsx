import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ResourcesPage } from '../../pages/ResourcesPage';
import * as topicsApi from '../../services/topics';

// Mock the APIs
vi.mock('../../services/topics', () => ({
  topicsApi: {
    getTopic: vi.fn(),
    getTopicResources: vi.fn(),
  },
}));

describe('ResourcesPage', () => {
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

  const renderWithProviders = (topicId: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/resources/${topicId}`]}>
          <Routes>
            <Route path="/resources/:topicId" element={<ResourcesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('shows loading state while fetching topic', () => {
    vi.mocked(topicsApi.topicsApi.getTopic).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue({
      success: true,
      data: {
        topicId: 'topic-1',
        totalCount: 0,
        filters: {},
        resources: [],
        groupedByType: {},
        metadata: { types: [], difficulties: [], pricing: [] },
      },
    });

    renderWithProviders('topic-1');

    expect(screen.getByText(/Loading topic.../i)).toBeInTheDocument();
  });

  it('shows error state when topic fetch fails', async () => {
    vi.mocked(topicsApi.topicsApi.getTopic).mockRejectedValue(new Error('Failed'));
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue({
      success: true,
      data: {
        topicId: 'topic-1',
        totalCount: 0,
        filters: {},
        resources: [],
        groupedByType: {},
        metadata: { types: [], difficulties: [], pricing: [] },
      },
    });

    renderWithProviders('topic-1');

    await waitFor(() => {
      expect(screen.getByText(/Failed to load topic/i)).toBeInTheDocument();
    });
  });

  it('renders with topicId from params', async () => {
    vi.mocked(topicsApi.topicsApi.getTopic).mockResolvedValue({
      success: true,
      data: { id: 'topic-1', name: 'React Testing' },
    });
    vi.mocked(topicsApi.topicsApi.getTopicResources).mockResolvedValue({
      success: true,
      data: {
        topicId: 'topic-1',
        totalCount: 0,
        filters: {},
        resources: [],
        groupedByType: {},
        metadata: { types: [], difficulties: [], pricing: [] },
      },
    });

    renderWithProviders('topic-1');

    await waitFor(() => {
      expect(topicsApi.topicsApi.getTopic).toHaveBeenCalledWith('topic-1');
    });
  });
});
