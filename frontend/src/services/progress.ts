import { api } from './api';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProgressEntry {
  id: string;
  planId: string;
  resourceId: string;
  status: ProgressStatus;
  notes: string | null;
  timeSpent: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressSummary {
  totalResources: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  totalTimeSpent: number;
  completionPercentage: number;
}

export interface PlanProgressResponse {
  success: boolean;
  data: {
    planId: string;
    progressEntries: ProgressEntry[];
    summary: ProgressSummary;
  };
}

export interface CreateProgressRequest {
  planId: string;
  resourceId: string;
  status: ProgressStatus;
  notes?: string;
  timeSpent?: number;
}

export interface UpdateProgressRequest {
  status?: ProgressStatus;
  notes?: string;
  timeSpent?: number;
}

export interface OverallStats {
  totalPlans: number;
  totalResources: number;
  completedResources: number;
  inProgressResources: number;
  totalTimeSpent: number;
  averageCompletionPercentage: number;
  recentActivity: Array<{
    planId: string;
    planTitle: string;
    lastUpdated: string;
    completionPercentage: number;
  }>;
}

export const progressApi = {
  /**
   * Create or update a progress entry
   */
  async createProgress(
    data: CreateProgressRequest
  ): Promise<{
    success: boolean;
    data: ProgressEntry;
  }> {
    const response = await api.post('/progress', data);
    return response.data;
  },

  /**
   * Get all progress for a specific plan
   */
  async getPlanProgress(planId: string): Promise<PlanProgressResponse> {
    const response = await api.get(`/progress/${planId}`);
    return response.data;
  },

  /**
   * Update a specific progress entry
   */
  async updateProgress(
    planId: string,
    resourceId: string,
    data: UpdateProgressRequest
  ): Promise<{
    success: boolean;
    data: ProgressEntry;
  }> {
    const response = await api.patch(`/progress/${planId}/${resourceId}`, data);
    return response.data;
  },

  /**
   * Get overall learning statistics
   */
  async getOverallStats(): Promise<{
    success: boolean;
    data: OverallStats;
  }> {
    const response = await api.get('/progress/stats');
    return response.data;
  },
};
