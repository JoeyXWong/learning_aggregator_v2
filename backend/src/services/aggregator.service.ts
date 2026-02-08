import { Topic, Resource, Prisma } from '@prisma/client';
import { youtubeService } from './youtube.service';
import { githubService } from './github.service';
import {
  classifierService,
  type RawResource,
  type ClassifiedResource,
} from './classifier.service';
import { logger } from '../utils/logger';
import { prisma } from '../utils/db';

export interface AggregationOptions {
  maxResourcesPerSource?: number;
  includeYouTube?: boolean;
  includeGitHub?: boolean;
  minQualityScore?: number;
}

export interface AggregationResult {
  topicId: string;
  resourceCount: number;
  sources: {
    youtube: number;
    github: number;
  };
  averageQualityScore: number;
}

export interface ResourceFilters {
  type?: string;
  difficulty?: string;
  pricing?: string;
  minQualityScore?: number;
}

/**
 * Resource Aggregation Orchestrator
 * Coordinates resource discovery from multiple sources, classifies, deduplicates, and stores
 */
export class AggregatorService {
  private readonly cache: Map<string, { timestamp: number; data: AggregationResult }>;
  private readonly cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.cache = new Map();
  }

  /**
   * Aggregate resources for a topic from all available sources
   */
  async aggregateResources(
    topicName: string,
    options: AggregationOptions = {}
  ): Promise<AggregationResult> {
    const {
      maxResourcesPerSource = 20,
      includeYouTube = true,
      includeGitHub = true,
      minQualityScore = 30,
    } = options;

    logger.info('Starting resource aggregation', { topicName, options });

    try {
      // Step 1: Create or find topic
      const topic = await this.getOrCreateTopic(topicName);

      // Check cache first
      const cacheKey = `topic:${topic.id}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Returning cached resources', { topicId: topic.id });
        return cached;
      }

      // Step 2: Fetch resources from all sources in parallel
      const [youtubeResources, githubResources] = await Promise.all([
        includeYouTube
          ? this.fetchYouTubeResources(topicName, maxResourcesPerSource)
          : Promise.resolve([]),
        includeGitHub
          ? this.fetchGitHubResources(topicName, maxResourcesPerSource)
          : Promise.resolve([]),
      ]);

      logger.info('Fetched raw resources', {
        youtube: youtubeResources.length,
        github: githubResources.length,
      });

      // Step 3: Classify all resources
      const allRawResources = [...youtubeResources, ...githubResources];
      const classifiedResources =
        classifierService.classifyBatch(allRawResources);

      // Step 4: Filter by quality score
      const qualityResources = classifiedResources.filter(
        (r) => r.qualityScore >= minQualityScore
      );

      logger.info('Resources after quality filter', {
        before: classifiedResources.length,
        after: qualityResources.length,
        minScore: minQualityScore,
      });

      // Step 5: Deduplicate resources
      const uniqueResources = this.deduplicateResources(qualityResources);

      logger.info('Resources after deduplication', {
        before: qualityResources.length,
        after: uniqueResources.length,
      });

      // Step 6: Store resources in database
      await this.storeResources(topic.id, uniqueResources);

      // Step 7: Update topic metadata
      await this.updateTopicMetadata(topic.id, uniqueResources.length);

      // Calculate result stats
      const result: AggregationResult = {
        topicId: topic.id,
        resourceCount: uniqueResources.length,
        sources: {
          youtube: uniqueResources.filter((r) => r.type === 'video').length,
          github: uniqueResources.filter((r) => r.type === 'repository').length,
        },
        averageQualityScore:
          uniqueResources.length > 0
            ? uniqueResources.reduce((sum, r) => sum + r.qualityScore, 0) /
              uniqueResources.length
            : 0,
      };

      // Cache the result
      this.setCache(cacheKey, result);

      logger.info('Resource aggregation completed', result);
      return result;
    } catch (error) {
      logger.error('Resource aggregation failed', { topicName, error });
      throw error;
    }
  }

  /**
   * Fetch resources from YouTube
   */
  private async fetchYouTubeResources(
    topic: string,
    maxResults: number
  ): Promise<RawResource[]> {
    if (!youtubeService.isAvailable()) {
      logger.warn('YouTube service not available');
      return [];
    }

    try {
      const videos = await youtubeService.searchVideos(topic, { maxResults });

      return videos.map((video) => ({
        url: video.url,
        title: video.title,
        description: video.description,
        duration: video.duration,
        platform: 'youtube.com',
        viewCount: video.viewCount,
        rating: video.rating,
        publishDate: video.publishDate,
      }));
    } catch (error) {
      logger.error('Failed to fetch YouTube resources', { topic, error });
      return [];
    }
  }

  /**
   * Fetch resources from GitHub
   */
  private async fetchGitHubResources(
    topic: string,
    maxResults: number
  ): Promise<RawResource[]> {
    if (!githubService.isAvailable()) {
      logger.warn('GitHub service not available');
      return [];
    }

    try {
      const repos = await githubService.searchRepositories(topic, {
        maxResults,
      });

      return repos.map((repo) => ({
        url: repo.url,
        title: repo.title,
        description: repo.description,
        platform: 'github.com',
        stars: repo.stars,
        lastUpdated: repo.lastUpdated,
      }));
    } catch (error) {
      logger.error('Failed to fetch GitHub resources', { topic, error });
      return [];
    }
  }

  /**
   * Deduplicate resources by normalized URL and title similarity
   */
  private deduplicateResources(
    resources: ClassifiedResource[]
  ): ClassifiedResource[] {
    const seen = new Map<string, ClassifiedResource>();

    for (const resource of resources) {
      const key = resource.normalizedUrl;

      // If URL already exists, keep the higher quality one
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if (resource.qualityScore > existing.qualityScore) {
          seen.set(key, resource);
        }
      } else {
        seen.set(key, resource);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Store resources in database
   */
  private async storeResources(
    topicId: string,
    resources: ClassifiedResource[]
  ): Promise<void> {
    try {
      for (const resource of resources) {
        // Upsert resource
        const dbResource = await prisma.resource.upsert({
          where: { url: resource.url },
          update: {
            title: resource.title,
            description: resource.description,
            type: resource.type,
            difficulty: resource.difficulty,
            pricing: resource.pricing,
            platform: resource.platform,
            duration: resource.duration,
            rating: resource.rating,
            reviewCount: 0,
            viewCount: resource.viewCount,
            publishDate: resource.publishDate,
            lastUpdatedDate: resource.lastUpdated,
            lastVerifiedAt: new Date(),
            qualityScore: resource.qualityScore,
            normalizedUrl: resource.normalizedUrl,
            updatedAt: new Date(),
          },
          create: {
            url: resource.url,
            normalizedUrl: resource.normalizedUrl,
            title: resource.title,
            description: resource.description,
            type: resource.type,
            difficulty: resource.difficulty,
            pricing: resource.pricing,
            platform: resource.platform,
            duration: resource.duration,
            rating: resource.rating,
            reviewCount: 0,
            viewCount: resource.viewCount,
            publishDate: resource.publishDate,
            lastUpdatedDate: resource.lastUpdated,
            lastVerifiedAt: new Date(),
            qualityScore: resource.qualityScore,
          },
        });

        // Create topic-resource relationship if it doesn't exist
        await prisma.topicResource.upsert({
          where: {
            topicId_resourceId: {
              topicId,
              resourceId: dbResource.id,
            },
          },
          update: {
            relevanceScore: resource.qualityScore,
          },
          create: {
            topicId,
            resourceId: dbResource.id,
            relevanceScore: resource.qualityScore,
          },
        });
      }

      logger.info('Stored resources in database', {
        topicId,
        count: resources.length,
      });
    } catch (error) {
      logger.error('Failed to store resources', { topicId, error });
      throw error;
    }
  }

  /**
   * Get or create a topic
   */
  private async getOrCreateTopic(name: string): Promise<Topic> {
    const normalizedName = name.toLowerCase().trim();
    const slug = normalizedName.replace(/\s+/g, '-');

    return await prisma.topic.upsert({
      where: { slug },
      update: {
        lastAggregatedAt: new Date(),
      },
      create: {
        name,
        normalizedName,
        slug,
        lastAggregatedAt: new Date(),
      },
    });
  }

  /**
   * Update topic metadata
   */
  private async updateTopicMetadata(
    topicId: string,
    resourceCount: number
  ): Promise<void> {
    await prisma.topic.update({
      where: { id: topicId },
      data: {
        resourceCount,
        lastAggregatedAt: new Date(),
      },
    });
  }

  /**
   * Get cached data
   */
  private getFromCache(key: string): AggregationResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache data
   */
  private setCache(key: string, data: AggregationResult): void {
    this.cache.set(key, {
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Clear cache for a topic
   */
  clearCache(topicId: string): void {
    this.cache.delete(`topic:${topicId}`);
  }

  /**
   * Get resources for a topic with filters
   */
  async getTopicResources(
    topicId: string,
    filters: ResourceFilters = {}
  ): Promise<Resource[]> {
    const resourceWhere: Prisma.ResourceWhereInput = {};

    if (filters.type) {
      resourceWhere.type = filters.type;
    }
    if (filters.difficulty) {
      resourceWhere.difficulty = filters.difficulty;
    }
    if (filters.pricing) {
      resourceWhere.pricing = filters.pricing;
    }
    if (filters.minQualityScore) {
      resourceWhere.qualityScore = { gte: filters.minQualityScore };
    }

    const topicResources = await prisma.topicResource.findMany({
      where: {
        topicId,
        resource: resourceWhere,
      },
      include: {
        resource: true,
      },
      orderBy: {
        relevanceScore: 'desc',
      },
    });

    return topicResources.map((tr) => tr.resource);
  }
}

export const aggregatorService = new AggregatorService();
