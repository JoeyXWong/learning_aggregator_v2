import { api } from './api';

export interface PlanPreferences {
  freeOnly?: boolean;
  pace?: 'casual' | 'moderate' | 'intensive';
  preferredTypes?: string[];
  maxDuration?: number;
}

export interface PlanResource {
  resourceId: string;
  title: string;
  url: string;
  type: string;
  difficulty: string;
  duration: number | null;
  reason: string;
}

export interface PlanPhase {
  name: string;
  description: string;
  order: number;
  estimatedHours: number;
  resources: PlanResource[];
}

export interface LearningPlan {
  id: string;
  topicId: string;
  title: string;
  preferences: PlanPreferences;
  phases: PlanPhase[];
  totalDuration: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratePlanRequest {
  topicId: string;
  preferences?: PlanPreferences;
}

export const plansApi = {
  /**
   * Generate a new learning plan
   */
  async generatePlan(data: GeneratePlanRequest): Promise<{
    success: boolean;
    data: LearningPlan;
    message?: string;
  }> {
    const response = await api.post('/plans/generate', data);
    return response.data;
  },

  /**
   * Get a learning plan by ID
   */
  async getPlan(planId: string): Promise<{
    success: boolean;
    data: LearningPlan;
  }> {
    const response = await api.get(`/plans/${planId}`);
    return response.data;
  },

  /**
   * List all learning plans
   */
  async listPlans(): Promise<{
    success: boolean;
    data: {
      plans: LearningPlan[];
      count: number;
    };
  }> {
    const response = await api.get('/plans');
    return response.data;
  },

  /**
   * Delete a learning plan
   */
  async deletePlan(planId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`/plans/${planId}`);
    return response.data;
  },

  /**
   * Export a learning plan as markdown
   */
  async exportPlan(
    planId: string,
    format: 'markdown' = 'markdown'
  ): Promise<Blob> {
    const response = await api.get(`/plans/${planId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
