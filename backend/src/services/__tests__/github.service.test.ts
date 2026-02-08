import axios from 'axios';
import { GitHubService } from '../github.service';
import type { GitHubSearchOptions } from '../github.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('../../config', () => ({
  config: {
    apiKeys: {
      youtube: '',
      github: 'test-github-token',
      claude: '',
    },
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('GitHubService', () => {
  let githubService: GitHubService;

  beforeEach(() => {
    jest.clearAllMocks();
    githubService = new GitHubService();
  });

  describe('searchRepositories', () => {
    it('should successfully search and return GitHub repositories', async () => {
      const mockSearchResponse = {
        data: {
          items: [
            {
              id: 12345,
              full_name: 'facebook/react',
              description: 'A JavaScript library for building user interfaces',
              html_url: 'https://github.com/facebook/react',
              stargazers_count: 200000,
              updated_at: '2023-05-15T10:00:00Z',
              language: 'JavaScript',
              topics: ['react', 'javascript', 'ui'],
              archived: false,
              owner: { login: 'facebook' },
            },
            {
              id: 67890,
              full_name: 'vuejs/vue',
              description: 'Progressive JavaScript Framework',
              html_url: 'https://github.com/vuejs/vue',
              stargazers_count: 150000,
              updated_at: '2023-04-20T14:30:00Z',
              language: 'TypeScript',
              topics: ['vue', 'frontend'],
              archived: false,
              owner: { login: 'vuejs' },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockSearchResponse);

      const results = await githubService.searchRepositories('React');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('12345');
      expect(results[0].title).toBe('facebook/react');
      expect(results[0].url).toBe('https://github.com/facebook/react');
      expect(results[0].stars).toBe(200000);
      expect(results[0].language).toBe('JavaScript');
      expect(results[0].topics).toContain('react');
    });

    it('should filter out archived repositories', async () => {
      const mockSearchResponse = {
        data: {
          items: [
            {
              id: 12345,
              full_name: 'facebook/react',
              description: 'A JavaScript library',
              html_url: 'https://github.com/facebook/react',
              stargazers_count: 200000,
              updated_at: '2023-05-15T10:00:00Z',
              language: 'JavaScript',
              topics: ['react'],
              archived: false,
              owner: { login: 'facebook' },
            },
            {
              id: 67890,
              full_name: 'old/archived-repo',
              description: 'Old archived repository',
              html_url: 'https://github.com/old/archived-repo',
              stargazers_count: 50000,
              updated_at: '2020-01-01T00:00:00Z',
              language: 'JavaScript',
              topics: [],
              archived: true,
              owner: { login: 'old' },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockSearchResponse);

      const results = await githubService.searchRepositories('React');

      expect(results).toHaveLength(1);
      expect(results[0].isArchived).toBe(false);
    });

    it('should filter out repositories without descriptions', async () => {
      const mockSearchResponse = {
        data: {
          items: [
            {
              id: 12345,
              full_name: 'facebook/react',
              description: 'A JavaScript library',
              html_url: 'https://github.com/facebook/react',
              stargazers_count: 200000,
              updated_at: '2023-05-15T10:00:00Z',
              language: 'JavaScript',
              topics: ['react'],
              archived: false,
              owner: { login: 'facebook' },
            },
            {
              id: 67890,
              full_name: 'test/no-description',
              description: null,
              html_url: 'https://github.com/test/no-description',
              stargazers_count: 100,
              updated_at: '2023-01-01T00:00:00Z',
              language: 'JavaScript',
              topics: [],
              archived: false,
              owner: { login: 'test' },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockSearchResponse);

      const results = await githubService.searchRepositories('React');

      expect(results).toHaveLength(1);
      expect(results[0].description).toBeTruthy();
    });

    it('should deduplicate repositories by URL', async () => {
      const mockSearchResponse1 = {
        data: {
          items: [
            {
              id: 12345,
              full_name: 'facebook/react',
              description: 'A JavaScript library',
              html_url: 'https://github.com/facebook/react',
              stargazers_count: 200000,
              updated_at: '2023-05-15T10:00:00Z',
              language: 'JavaScript',
              topics: ['react'],
              archived: false,
              owner: { login: 'facebook' },
            },
          ],
        },
      };

      const mockSearchResponse2 = {
        data: {
          items: [
            {
              id: 12345,
              full_name: 'facebook/react',
              description: 'A JavaScript library',
              html_url: 'https://github.com/facebook/react',
              stargazers_count: 200000,
              updated_at: '2023-05-15T10:00:00Z',
              language: 'JavaScript',
              topics: ['react'],
              archived: false,
              owner: { login: 'facebook' },
            },
          ],
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse1)
        .mockResolvedValueOnce(mockSearchResponse2);

      const results = await githubService.searchRepositories('React');

      expect(results).toHaveLength(1);
    });

    it('should sort results by stars and limit to maxResults', async () => {
      const mockSearchResponse = {
        data: {
          items: [
            {
              id: 1,
              full_name: 'low/stars',
              description: 'Low stars repo',
              html_url: 'https://github.com/low/stars',
              stargazers_count: 100,
              updated_at: '2023-01-01T00:00:00Z',
              language: 'JavaScript',
              topics: [],
              archived: false,
              owner: { login: 'low' },
            },
            {
              id: 2,
              full_name: 'high/stars',
              description: 'High stars repo',
              html_url: 'https://github.com/high/stars',
              stargazers_count: 10000,
              updated_at: '2023-01-01T00:00:00Z',
              language: 'JavaScript',
              topics: [],
              archived: false,
              owner: { login: 'high' },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockSearchResponse);

      const results = await githubService.searchRepositories('React', {
        maxResults: 1,
      });

      expect(results).toHaveLength(1);
      expect(results[0].stars).toBe(10000);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 403 },
        message: 'Rate limit exceeded',
      });

      const results = await githubService.searchRepositories('React');

      expect(results).toHaveLength(0);
    });

    it('should handle 401 authentication errors', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401 },
        message: 'Authentication failed',
      });

      const results = await githubService.searchRepositories('React');

      expect(results).toHaveLength(0);
    });

    it('should pass search options correctly', async () => {
      const mockSearchResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValue(mockSearchResponse);

      const options: GitHubSearchOptions = {
        maxResults: 10,
        sort: 'stars',
        minStars: 100,
      };

      await githubService.searchRepositories('Python', options);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            sort: 'stars',
            order: 'desc',
            per_page: 10,
          }),
        })
      );
    });

    it('should handle empty search results', async () => {
      const mockSearchResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValue(mockSearchResponse);

      const results = await githubService.searchRepositories(
        'NonexistentTopic'
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('deduplicateResources', () => {
    it('should remove duplicate resources by URL', () => {
      const resources = [
        {
          id: '1',
          title: 'facebook/react',
          description: 'React library',
          url: 'https://github.com/facebook/react',
          stars: 200000,
          lastUpdated: new Date(),
          language: 'JavaScript',
          topics: [],
          ownerName: 'facebook',
          isArchived: false,
        },
        {
          id: '2',
          title: 'facebook/react',
          description: 'React library',
          url: 'https://github.com/facebook/react',
          stars: 200000,
          lastUpdated: new Date(),
          language: 'JavaScript',
          topics: [],
          ownerName: 'facebook',
          isArchived: false,
        },
      ];

      const deduplicated = (githubService as any).deduplicateResources(
        resources
      );

      expect(deduplicated).toHaveLength(1);
    });
  });

  describe('transformToResource', () => {
    it('should transform repository with all data', () => {
      const repo = {
        id: 12345,
        full_name: 'facebook/react',
        description: 'A JavaScript library',
        html_url: 'https://github.com/facebook/react',
        stargazers_count: 200000,
        updated_at: '2023-05-15T10:00:00Z',
        language: 'JavaScript',
        topics: ['react', 'javascript'],
        archived: false,
        owner: { login: 'facebook' },
      };

      const resource = (githubService as any).transformToResource(repo);

      expect(resource).not.toBeNull();
      expect(resource.id).toBe('12345');
      expect(resource.title).toBe('facebook/react');
      expect(resource.url).toBe('https://github.com/facebook/react');
      expect(resource.stars).toBe(200000);
      expect(resource.language).toBe('JavaScript');
      expect(resource.topics).toHaveLength(2);
    });

    it('should return null for archived repositories', () => {
      const repo = {
        id: 12345,
        full_name: 'old/archived',
        description: 'Old repo',
        html_url: 'https://github.com/old/archived',
        stargazers_count: 1000,
        updated_at: '2020-01-01T00:00:00Z',
        language: 'JavaScript',
        topics: [],
        archived: true,
        owner: { login: 'old' },
      };

      const resource = (githubService as any).transformToResource(repo);

      expect(resource).toBeNull();
    });

    it('should return null for repositories without description', () => {
      const repo = {
        id: 12345,
        full_name: 'test/no-desc',
        description: null,
        html_url: 'https://github.com/test/no-desc',
        stargazers_count: 1000,
        updated_at: '2023-01-01T00:00:00Z',
        language: 'JavaScript',
        topics: [],
        archived: false,
        owner: { login: 'test' },
      };

      const resource = (githubService as any).transformToResource(repo);

      expect(resource).toBeNull();
    });

    it('should handle repositories with null language', () => {
      const repo = {
        id: 12345,
        full_name: 'test/repo',
        description: 'Test repository',
        html_url: 'https://github.com/test/repo',
        stargazers_count: 1000,
        updated_at: '2023-01-01T00:00:00Z',
        language: null,
        topics: [],
        archived: false,
        owner: { login: 'test' },
      };

      const resource = (githubService as any).transformToResource(repo);

      expect(resource).not.toBeNull();
      expect(resource.language).toBeNull();
    });

    it('should return null on transformation error', () => {
      const invalidRepo = {
        id: 12345,
        full_name: null,
        description: 'Valid description',
        html_url: null,
        stargazers_count: null,
        updated_at: null,
        language: 'JavaScript',
        topics: [],
        archived: false,
        owner: null,
      };

      const resource = (githubService as any).transformToResource(invalidRepo);

      expect(resource).toBeNull();
    });
  });

  describe('getHeaders', () => {
    it('should include authorization header when token is available', () => {
      const headers = (githubService as any).getHeaders();

      expect(headers).toHaveProperty('Authorization');
      expect(headers.Authorization).toBe('token test-github-token');
      expect(headers.Accept).toBe('application/vnd.github.v3+json');
    });

    it('should not include authorization header when token is not available', () => {
      const serviceWithoutToken = new GitHubService();
      (serviceWithoutToken as any).token = '';

      const headers = (serviceWithoutToken as any).getHeaders();

      expect(headers).not.toHaveProperty('Authorization');
      expect(headers.Accept).toBe('application/vnd.github.v3+json');
    });
  });

  describe('isAvailable', () => {
    it('should always return true', () => {
      expect(githubService.isAvailable()).toBe(true);
    });
  });

  describe('getRateLimit', () => {
    it('should successfully fetch rate limit information', async () => {
      const mockRateLimitResponse = {
        data: {
          resources: {
            search: {
              remaining: 30,
              limit: 30,
            },
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockRateLimitResponse);

      const rateLimit = await githubService.getRateLimit();

      expect(rateLimit).not.toBeNull();
      expect(rateLimit?.remaining).toBe(30);
      expect(rateLimit?.limit).toBe(30);
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const rateLimit = await githubService.getRateLimit();

      expect(rateLimit).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle non-Axios errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const results = await githubService.searchRepositories('React');

      expect(results).toHaveLength(0);
    });

    it('should handle Axios errors without response', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        message: 'Network timeout',
      });

      const results = await githubService.searchRepositories('React');

      expect(results).toHaveLength(0);
    });
  });
});
