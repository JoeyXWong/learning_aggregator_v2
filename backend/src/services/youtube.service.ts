import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface YouTubeResource {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number; // in minutes
  viewCount: number;
  rating: number;
  thumbnailUrl: string;
  publishDate: Date;
  channelTitle: string;
}

export interface YouTubeSearchOptions {
  maxResults?: number;
  order?: 'relevance' | 'date' | 'rating' | 'viewCount';
  videoDuration?: 'short' | 'medium' | 'long' | 'any';
}

// YouTube API response types
interface YouTubeSearchItem {
  id: { videoId: string };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    dislikeCount?: string;
  };
}

/**
 * YouTube Data API v3 Integration Service
 * Searches for educational videos and extracts metadata
 */
export class YouTubeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly defaultMaxResults = 20;

  constructor() {
    this.apiKey = config.apiKeys.youtube;
    if (!this.apiKey) {
      logger.warn('YouTube API key not configured');
    }
  }

  /**
   * Search for educational videos on a given topic
   */
  async searchVideos(
    topic: string,
    options: YouTubeSearchOptions = {}
  ): Promise<YouTubeResource[]> {
    if (!this.apiKey) {
      logger.error('YouTube API key is missing');
      return [];
    }

    try {
      const {
        maxResults = this.defaultMaxResults,
        order = 'relevance',
        videoDuration = 'any',
      } = options;

      // Step 1: Search for videos
      const searchQuery = `${topic} tutorial OR ${topic} course OR ${topic} guide`;
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults,
          order,
          videoDuration,
          videoEmbeddable: true,
          videoSyndicated: true,
          relevanceLanguage: 'en',
        },
      });

      const videoIds = (searchResponse.data.items as YouTubeSearchItem[])
        .map((item) => item.id.videoId)
        .join(',');

      if (!videoIds) {
        logger.info(`No YouTube videos found for topic: ${topic}`);
        return [];
      }

      // Step 2: Get detailed video information including statistics and duration
      const videosResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          part: 'snippet,contentDetails,statistics',
          id: videoIds,
        },
      });

      // Step 3: Transform to our resource format
      const resources = (videosResponse.data.items as YouTubeVideoItem[])
        .map((video) => this.transformToResource(video))
        .filter((resource: YouTubeResource | null) => resource !== null);

      logger.info(
        `Found ${resources.length} YouTube videos for topic: ${topic}`
      );
      return resources;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          logger.error('YouTube API quota exceeded or invalid key');
        } else if (error.response?.status === 400) {
          logger.error('Invalid YouTube API request', { error: error.message });
        } else {
          logger.error('YouTube API request failed', {
            status: error.response?.status,
            message: error.message,
          });
        }
      } else {
        logger.error('Unexpected error in YouTube service', { error });
      }
      return [];
    }
  }

  /**
   * Transform YouTube API response to our resource format
   */
  private transformToResource(video: YouTubeVideoItem): YouTubeResource | null {
    try {
      const snippet = video.snippet;
      const statistics = video.statistics;
      const contentDetails = video.contentDetails;

      // Parse ISO 8601 duration (e.g., PT15M33S)
      const duration = this.parseDuration(contentDetails.duration);

      // Calculate rating (like ratio)
      const likeCount = parseInt(statistics.likeCount || '0');
      const dislikeCount = parseInt(statistics.dislikeCount || '0');
      const totalRatings = likeCount + dislikeCount;
      const rating =
        totalRatings > 0 ? (likeCount / totalRatings) * 5 : 4.0;

      return {
        id: video.id,
        title: snippet.title,
        description: snippet.description || '',
        url: `https://www.youtube.com/watch?v=${video.id}`,
        duration,
        viewCount: parseInt(statistics.viewCount || '0'),
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal
        thumbnailUrl:
          snippet.thumbnails.high?.url ||
          snippet.thumbnails.medium?.url ||
          snippet.thumbnails.default?.url ||
          '',
        publishDate: new Date(snippet.publishedAt),
        channelTitle: snippet.channelTitle,
      };
    } catch (error) {
      logger.warn('Failed to transform YouTube video', {
        videoId: video.id,
        error,
      });
      return null;
    }
  }

  /**
   * Parse ISO 8601 duration format to minutes
   * Example: PT15M33S -> 15.55 minutes
   * Example: PT1H2M10S -> 62.17 minutes
   */
  private parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  /**
   * Check if the service is configured and available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const youtubeService = new YouTubeService();
