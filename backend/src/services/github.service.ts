import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface GitHubResource {
  id: string;
  title: string;
  description: string;
  url: string;
  stars: number;
  lastUpdated: Date;
  language: string | null;
  topics: string[];
  ownerName: string;
  isArchived: boolean;
}

export interface GitHubSearchOptions {
  maxResults?: number;
  sort?: 'stars' | 'updated' | 'best-match';
  minStars?: number;
}

// GitHub API response type
interface GitHubRepoItem {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  language: string | null;
  topics: string[];
  archived: boolean;
  owner: { login: string };
}

/**
 * GitHub API Integration Service
 * Searches for educational repositories, tutorials, and awesome lists
 */
export class GitHubService {
  private readonly token: string;
  private readonly baseUrl = 'https://api.github.com';
  private readonly defaultMaxResults = 20;

  constructor() {
    this.token = config.apiKeys.github;
    if (!this.token) {
      logger.warn('GitHub token not configured - rate limits will be restrictive');
    }
  }

  /**
   * Search for educational GitHub repositories related to a topic
   */
  async searchRepositories(
    topic: string,
    options: GitHubSearchOptions = {}
  ): Promise<GitHubResource[]> {
    try {
      const {
        maxResults = this.defaultMaxResults,
        sort = 'best-match',
        minStars = 10,
      } = options;

      // Build search query focusing on educational content
      const educationalKeywords = [
        'tutorial',
        'awesome',
        'learn',
        'guide',
        'course',
        'resources',
        'examples',
        'documentation',
      ];

      const searchQueries = [
        // Primary: topic + educational keywords
        `${topic} ${educationalKeywords.slice(0, 3).join(' OR ')} stars:>=${minStars}`,
        // Awesome lists are highly curated
        `awesome-${topic.toLowerCase().replace(/\s+/g, '-')} stars:>=${minStars}`,
      ];

      const allResources: GitHubResource[] = [];

      // Execute multiple searches to get diverse results
      for (const query of searchQueries) {
        try {
          const resources = await this.executeSearch(query, sort, maxResults);
          allResources.push(...resources);

          // Short delay to respect rate limits
          await this.sleep(500);
        } catch (error) {
          logger.warn('GitHub search query failed', { query, error });
        }
      }

      // Deduplicate by URL
      const uniqueResources = this.deduplicateResources(allResources);

      // Sort by stars and limit
      const sortedResources = uniqueResources
        .sort((a, b) => b.stars - a.stars)
        .slice(0, maxResults);

      logger.info(
        `Found ${sortedResources.length} GitHub repositories for topic: ${topic}`
      );
      return sortedResources;
    } catch (error) {
      logger.error('GitHub search failed', { topic, error });
      return [];
    }
  }

  /**
   * Execute a single GitHub search query
   */
  private async executeSearch(
    query: string,
    sort: string,
    maxResults: number
  ): Promise<GitHubResource[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search/repositories`, {
        params: {
          q: query,
          sort: sort === 'best-match' ? undefined : sort,
          order: 'desc',
          per_page: Math.min(maxResults, 100), // GitHub API max is 100
        },
        headers: this.getHeaders(),
      });

      const resources = response.data.items
        .map((repo: GitHubRepoItem) => this.transformToResource(repo))
        .filter((resource: GitHubResource | null) => resource !== null);

      return resources;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          logger.error('GitHub API rate limit exceeded');
        } else if (error.response?.status === 401) {
          logger.error('GitHub API authentication failed - check token');
        } else {
          logger.error('GitHub API request failed', {
            status: error.response?.status,
            message: error.message,
          });
        }
      }
      throw error;
    }
  }

  /**
   * Transform GitHub API response to our resource format
   */
  private transformToResource(repo: GitHubRepoItem): GitHubResource | null {
    try {
      // Filter out archived or very old repositories
      if (repo.archived) {
        return null;
      }

      // Filter out repos with no description
      if (!repo.description) {
        return null;
      }

      return {
        id: repo.id.toString(),
        title: repo.full_name,
        description: repo.description || '',
        url: repo.html_url,
        stars: repo.stargazers_count,
        lastUpdated: new Date(repo.updated_at),
        language: repo.language,
        topics: repo.topics || [],
        ownerName: repo.owner.login,
        isArchived: repo.archived,
      };
    } catch (error) {
      logger.warn('Failed to transform GitHub repository', {
        repoId: repo.id,
        error,
      });
      return null;
    }
  }

  /**
   * Remove duplicate resources by URL
   */
  private deduplicateResources(
    resources: GitHubResource[]
  ): GitHubResource[] {
    const seen = new Set<string>();
    return resources.filter((resource) => {
      if (seen.has(resource.url)) {
        return false;
      }
      seen.add(resource.url);
      return true;
    });
  }

  /**
   * Get request headers with authentication if token is available
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers.Authorization = `token ${this.token}`;
    }

    return headers;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return true; // GitHub API works without token, just with lower rate limits
  }

  /**
   * Get remaining rate limit
   */
  async getRateLimit(): Promise<{ remaining: number; limit: number } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/rate_limit`, {
        headers: this.getHeaders(),
      });

      return {
        remaining: response.data.resources.search.remaining,
        limit: response.data.resources.search.limit,
      };
    } catch (error) {
      logger.error('Failed to fetch GitHub rate limit', { error });
      return null;
    }
  }
}

export const githubService = new GitHubService();
