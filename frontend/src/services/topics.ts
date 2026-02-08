import { api } from './api';

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  difficulty: string | null;
  pricing: string | null;
  platform: string | null;
  duration: number | null;
  rating: number | null;
  viewCount: number | null;
  qualityScore: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
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

export interface TopicResourcesResponse {
  success: boolean;
  data: {
    topicId: string;
    totalCount: number;
    filters: Record<string, any>;
    resources: Resource[];
    groupedByType: Record<string, Resource[]>;
    metadata: {
      types: Array<{ type: string; count: number }>;
      difficulties: Array<{ value: string; count: number }>;
      pricing: Array<{ value: string; count: number }>;
    };
  };
}

export interface CreateTopicRequest {
  name: string;
  options?: {
    maxResourcesPerSource?: number;
    includeYouTube?: boolean;
    includeGitHub?: boolean;
    minQualityScore?: number;
  };
}

export const topicsApi = {
  /**
   * Create a new topic and aggregate resources
   */
  async createTopic(
    data: CreateTopicRequest
  ): Promise<{ success: boolean; data: AggregationResult }> {
    const response = await api.post('/topics', data);
    return response.data;
  },

  /**
   * Get resources for a topic with filters
   */
  async getTopicResources(
    topicId: string,
    filters?: {
      type?: string;
      difficulty?: string;
      pricing?: string;
      minQualityScore?: number;
    }
  ): Promise<TopicResourcesResponse> {
    const response = await api.get(`/topics/${topicId}/resources`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get topic details
   */
  async getTopic(topicId: string): Promise<any> {
    const response = await api.get(`/topics/${topicId}`);
    return response.data;
  },

  /**
   * List all topics
   */
  async listTopics(): Promise<any> {
    const response = await api.get('/topics');
    return response.data;
  },

  /**
   * Clear cache for a topic
   */
  async clearCache(topicId: string): Promise<any> {
    const response = await api.delete(`/topics/${topicId}/cache`);
    return response.data;
  },
};
