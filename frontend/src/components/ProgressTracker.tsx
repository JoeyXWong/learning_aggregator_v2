import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  progressApi,
  type ProgressStatus,
  type ProgressEntry,
} from '../services/progress';
import { type PlanResource } from '../services/plans';

interface ProgressTrackerProps {
  planId: string;
  resources: PlanResource[];
}

export function ProgressTracker({ planId, resources }: ProgressTrackerProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['progress', planId],
    queryFn: () => progressApi.getPlanProgress(planId),
  });

  const updateMutation = useMutation({
    mutationFn: (params: {
      resourceId: string;
      currentStatus: ProgressStatus;
    }) => {
      const nextStatus = getNextStatus(params.currentStatus);
      return progressApi.createProgress({
        planId,
        resourceId: params.resourceId,
        status: nextStatus,
      });
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['progress', planId] });
      const previousData = queryClient.getQueryData(['progress', planId]);

      // Optimistically update to next status
      queryClient.setQueryData(['progress', planId], (old: any) => {
        if (!old) return old;

        const nextStatus = getNextStatus(params.currentStatus);
        const existingEntry = old.data.progressEntries.find(
          (e: ProgressEntry) => e.resourceId === params.resourceId
        );

        let updatedEntries;
        if (existingEntry) {
          updatedEntries = old.data.progressEntries.map((e: ProgressEntry) =>
            e.resourceId === params.resourceId ? { ...e, status: nextStatus } : e
          );
        } else {
          updatedEntries = [
            ...old.data.progressEntries,
            {
              id: `temp-${params.resourceId}`,
              planId,
              resourceId: params.resourceId,
              status: nextStatus,
              notes: null,
              timeSpent: null,
              startedAt: null,
              completedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }

        // Recalculate summary
        const completedCount = updatedEntries.filter(
          (e: ProgressEntry) => e.status === 'completed'
        ).length;
        const inProgressCount = updatedEntries.filter(
          (e: ProgressEntry) => e.status === 'in_progress'
        ).length;
        const totalResources = resources.length;
        const notStartedCount = totalResources - completedCount - inProgressCount;

        return {
          ...old,
          data: {
            ...old.data,
            progressEntries: updatedEntries,
            summary: {
              ...old.data.summary,
              completedCount,
              inProgressCount,
              notStartedCount,
              completionPercentage: Math.round((completedCount / totalResources) * 100),
            },
          },
        };
      });

      return { previousData };
    },
    onError: (_err, _params, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['progress', planId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });

  const getResourceStatus = (resourceId: string): ProgressStatus => {
    if (!data?.data.progressEntries) return 'not_started';
    const entry = data.data.progressEntries.find((e) => e.resourceId === resourceId);
    return entry?.status || 'not_started';
  };

  const handleToggle = (resourceId: string) => {
    const currentStatus = getResourceStatus(resourceId);
    updateMutation.mutate({ resourceId, currentStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const summary = data?.data.summary || {
    totalResources: resources.length,
    completedCount: 0,
    inProgressCount: 0,
    notStartedCount: resources.length,
    totalTimeSpent: 0,
    completionPercentage: 0,
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">
            {summary.completedCount} / {summary.totalResources} completed (
            {summary.completionPercentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${summary.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-gray-600">
            Not Started: {summary.notStartedCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600">
            In Progress: {summary.inProgressCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Completed: {summary.completedCount}</span>
        </div>
      </div>

      {/* Resource Checkboxes (rendered by parent) */}
      <input type="hidden" data-testid="progress-tracker-mounted" />
    </div>
  );
}

// Helper function to cycle through statuses
function getNextStatus(current: ProgressStatus): ProgressStatus {
  switch (current) {
    case 'not_started':
      return 'in_progress';
    case 'in_progress':
      return 'completed';
    case 'completed':
      return 'not_started';
    default:
      return 'not_started';
  }
}

// Export for use in PlanViewer
export function useResourceProgress(planId: string, resourceId: string) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['progress', planId],
    queryFn: () => progressApi.getPlanProgress(planId),
  });

  const status: ProgressStatus =
    data?.data.progressEntries.find((e) => e.resourceId === resourceId)?.status ||
    'not_started';

  const updateMutation = useMutation({
    mutationFn: (newStatus: ProgressStatus) =>
      progressApi.createProgress({
        planId,
        resourceId,
        status: newStatus,
      }),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['progress', planId] });
      const previousData = queryClient.getQueryData(['progress', planId]);

      queryClient.setQueryData(['progress', planId], (old: any) => {
        if (!old) return old;

        const existingEntry = old.data.progressEntries.find(
          (e: ProgressEntry) => e.resourceId === resourceId
        );

        let updatedEntries;
        if (existingEntry) {
          updatedEntries = old.data.progressEntries.map((e: ProgressEntry) =>
            e.resourceId === resourceId ? { ...e, status: newStatus } : e
          );
        } else {
          updatedEntries = [
            ...old.data.progressEntries,
            {
              id: `temp-${resourceId}`,
              planId,
              resourceId,
              status: newStatus,
              notes: null,
              timeSpent: null,
              startedAt: null,
              completedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }

        return {
          ...old,
          data: {
            ...old.data,
            progressEntries: updatedEntries,
          },
        };
      });

      return { previousData };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['progress', planId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });

  const toggleStatus = () => {
    const nextStatus = getNextStatus(status);
    updateMutation.mutate(nextStatus);
  };

  return {
    status,
    toggleStatus,
    isUpdating: updateMutation.isPending,
  };
}
