import axios from 'axios';
import { YouTubeService } from '../youtube.service';
import type { YouTubeSearchOptions } from '../youtube.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('../../config', () => ({
  config: {
    apiKeys: {
      youtube: 'test-youtube-api-key',
      github: '',
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

describe('YouTubeService', () => {
  let youtubeService: YouTubeService;

  beforeEach(() => {
    jest.clearAllMocks();
    youtubeService = new YouTubeService();
  });

  describe('searchVideos', () => {
    it('should successfully search and return YouTube videos', async () => {
      const mockSearchResponse = {
        data: {
          items: [
            { id: { videoId: 'video1' } },
            { id: { videoId: 'video2' } },
          ],
        },
      };

      const mockVideosResponse = {
        data: {
          items: [
            {
              id: 'video1',
              snippet: {
                title: 'React Tutorial for Beginners',
                description: 'Learn React from scratch',
                publishedAt: '2023-01-15T10:00:00Z',
                channelTitle: 'Tech Academy',
                thumbnails: {
                  high: { url: 'https://example.com/thumb1.jpg' },
                },
              },
              contentDetails: {
                duration: 'PT15M30S',
              },
              statistics: {
                viewCount: '100000',
                likeCount: '5000',
                dislikeCount: '100',
              },
            },
            {
              id: 'video2',
              snippet: {
                title: 'Advanced React Patterns',
                description: 'Master advanced React concepts',
                publishedAt: '2023-02-20T14:30:00Z',
                channelTitle: 'Code Masters',
                thumbnails: {
                  medium: { url: 'https://example.com/thumb2.jpg' },
                },
              },
              contentDetails: {
                duration: 'PT1H2M10S',
              },
              statistics: {
                viewCount: '50000',
                likeCount: '2500',
                dislikeCount: '50',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);
      mockedAxios.get.mockResolvedValueOnce(mockVideosResponse);

      const results = await youtubeService.searchVideos('React');

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('video1');
      expect(results[0].title).toBe('React Tutorial for Beginners');
      expect(results[0].url).toBe('https://www.youtube.com/watch?v=video1');
      expect(results[0].duration).toBe(16); // 15 minutes 30 seconds
      expect(results[0].viewCount).toBe(100000);
      expect(results[0].channelTitle).toBe('Tech Academy');

      expect(results[1].id).toBe('video2');
      expect(results[1].duration).toBe(62); // 1 hour 2 minutes 10 seconds
    });

    it('should handle empty search results', async () => {
      const mockSearchResponse = {
        data: {
          items: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);

      const results = await youtubeService.searchVideos('NonexistentTopic');

      expect(results).toHaveLength(0);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 403 },
        message: 'Quota exceeded',
      });

      const results = await youtubeService.searchVideos('React');

      expect(results).toHaveLength(0);
    });

    it('should handle 400 bad request errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400 },
        message: 'Invalid request',
      });

      const results = await youtubeService.searchVideos('React');

      expect(results).toHaveLength(0);
    });

    it('should return empty array when API key is missing', async () => {
      const serviceWithoutKey = new YouTubeService();
      // Override apiKey to empty
      (serviceWithoutKey as any).apiKey = '';

      const results = await serviceWithoutKey.searchVideos('React');

      expect(results).toHaveLength(0);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should pass search options correctly', async () => {
      const mockSearchResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);

      const options: YouTubeSearchOptions = {
        maxResults: 10,
        order: 'viewCount',
        videoDuration: 'long',
      };

      await youtubeService.searchVideos('Python', options);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 10,
            order: 'viewCount',
            videoDuration: 'long',
          }),
        })
      );
    });

    it('should use default options when not provided', async () => {
      const mockSearchResponse = {
        data: { items: [] },
      };

      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);

      await youtubeService.searchVideos('JavaScript');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 20,
            order: 'relevance',
            videoDuration: 'any',
          }),
        })
      );
    });
  });

  describe('parseDuration', () => {
    it('should parse duration with only seconds', () => {
      const duration = (youtubeService as any).parseDuration('PT45S');
      expect(duration).toBe(1); // 45 seconds rounds to 1 minute
    });

    it('should parse duration with minutes and seconds', () => {
      const duration = (youtubeService as any).parseDuration('PT15M33S');
      expect(duration).toBe(16); // 15 minutes 33 seconds
    });

    it('should parse duration with hours, minutes, and seconds', () => {
      const duration = (youtubeService as any).parseDuration('PT1H2M10S');
      expect(duration).toBe(62); // 1 hour 2 minutes 10 seconds
    });

    it('should parse duration with only hours', () => {
      const duration = (youtubeService as any).parseDuration('PT2H');
      expect(duration).toBe(120); // 2 hours
    });

    it('should parse duration with only minutes', () => {
      const duration = (youtubeService as any).parseDuration('PT30M');
      expect(duration).toBe(30); // 30 minutes
    });

    it('should return 0 for invalid duration format', () => {
      const duration = (youtubeService as any).parseDuration('INVALID');
      expect(duration).toBe(0);
    });
  });

  describe('transformToResource', () => {
    it('should transform video with all data', () => {
      const video = {
        id: 'test123',
        snippet: {
          title: 'Test Video',
          description: 'Test Description',
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnails: {
            high: { url: 'https://example.com/thumb.jpg' },
          },
        },
        contentDetails: {
          duration: 'PT10M',
        },
        statistics: {
          viewCount: '1000',
          likeCount: '100',
          dislikeCount: '10',
        },
      };

      const resource = (youtubeService as any).transformToResource(video);

      expect(resource).not.toBeNull();
      expect(resource.id).toBe('test123');
      expect(resource.title).toBe('Test Video');
      expect(resource.url).toBe('https://www.youtube.com/watch?v=test123');
      expect(resource.duration).toBe(10);
      expect(resource.viewCount).toBe(1000);
      expect(resource.rating).toBeGreaterThan(0);
      expect(resource.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    });

    it('should handle missing statistics', () => {
      const video = {
        id: 'test123',
        snippet: {
          title: 'Test Video',
          description: 'Test Description',
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnails: {
            default: { url: 'https://example.com/thumb.jpg' },
          },
        },
        contentDetails: {
          duration: 'PT5M',
        },
        statistics: {},
      };

      const resource = (youtubeService as any).transformToResource(video);

      expect(resource).not.toBeNull();
      expect(resource.viewCount).toBe(0);
      expect(resource.rating).toBe(4.0); // Default rating when no likes/dislikes
    });

    it('should return null on transformation error', () => {
      const invalidVideo = {
        id: 'test123',
        snippet: null,
        contentDetails: null,
        statistics: null,
      };

      const resource = (youtubeService as any).transformToResource(
        invalidVideo
      );

      expect(resource).toBeNull();
    });

    it('should fallback to lower quality thumbnails', () => {
      const video = {
        id: 'test123',
        snippet: {
          title: 'Test Video',
          description: '',
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnails: {
            default: { url: 'https://example.com/default.jpg' },
          },
        },
        contentDetails: {
          duration: 'PT5M',
        },
        statistics: {},
      };

      const resource = (youtubeService as any).transformToResource(video);

      expect(resource.thumbnailUrl).toBe('https://example.com/default.jpg');
    });

    it('should calculate rating correctly', () => {
      const video = {
        id: 'test123',
        snippet: {
          title: 'Test Video',
          description: '',
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnails: {
            default: { url: 'https://example.com/thumb.jpg' },
          },
        },
        contentDetails: {
          duration: 'PT5M',
        },
        statistics: {
          viewCount: '1000',
          likeCount: '90',
          dislikeCount: '10',
        },
      };

      const resource = (youtubeService as any).transformToResource(video);

      // 90 likes / 100 total = 0.9 * 5 = 4.5
      expect(resource.rating).toBe(4.5);
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is configured', () => {
      expect(youtubeService.isAvailable()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      const serviceWithoutKey = new YouTubeService();
      (serviceWithoutKey as any).apiKey = '';

      expect(serviceWithoutKey.isAvailable()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle non-Axios errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const results = await youtubeService.searchVideos('React');

      expect(results).toHaveLength(0);
    });

    it('should handle Axios errors without response', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        message: 'Network timeout',
      });

      const results = await youtubeService.searchVideos('React');

      expect(results).toHaveLength(0);
    });
  });
});
