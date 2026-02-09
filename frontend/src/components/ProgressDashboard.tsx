import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { progressApi } from '../services/progress';
import { ProgressStats } from './ProgressStats';

interface ProgressDashboardProps {
  planId?: string;
}

export function ProgressDashboard({ planId }: ProgressDashboardProps) {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['progress', 'stats'],
    queryFn: () => progressApi.getOverallStats(),
    enabled: !planId,
  });

  const { data: planProgressData, isLoading: planLoading } = useQuery({
    queryKey: ['progress', planId],
    queryFn: () => progressApi.getPlanProgress(planId!),
    enabled: !!planId,
  });

  const isLoading = planId ? planLoading : statsLoading;

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading progress data...</span>
        </div>
      </div>
    );
  }

  // Render plan-specific progress
  if (planId && planProgressData?.success) {
    const { summary } = planProgressData.data;

    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Plan Progress
          </h2>
          <ProgressStats summary={summary} />
        </div>

        <div className="card bg-gradient-to-r from-indigo-50 to-blue-50">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Tip:</span> View the full plan to track
            individual resource progress and add notes.
          </p>
          <Link
            to={`/plans/${planId}`}
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Go to Plan Details →
          </Link>
        </div>
      </div>
    );
  }

  // Render overall stats
  if (statsData?.success) {
    const stats = statsData.data;

    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Learning Statistics
          </h2>
          <ProgressStats
            summary={{
              totalResources: stats.totalResources,
              completedCount: stats.completedResources,
              inProgressCount: stats.inProgressResources,
              notStartedCount: stats.notStartedResources,
              totalTimeSpent: stats.totalTimeSpent,
              completionPercentage: Math.round(stats.averageCompletionRate),
            }}
            totalTimeSpent={stats.totalTimeSpent}
          />
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Plans
            </h3>
            <p className="text-4xl font-bold text-indigo-600">
              {stats.totalPlans}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Average Completion
            </h3>
            <p className="text-4xl font-bold text-green-600">
              {Math.round(stats.averageCompletionRate)}%
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentActivity && stats.recentActivity.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  to={`/plans/${activity.planId}`}
                  className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {activity.resourceTitle}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        activity.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : activity.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {activity.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Last updated: {new Date(activity.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!stats.recentActivity || stats.recentActivity.length === 0) && (
          <div className="card bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No learning plans yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a learning plan to start tracking your progress
              </p>
              <Link
                to="/"
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Create Your First Plan
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card bg-red-50">
      <p className="text-red-700">Failed to load progress data</p>
    </div>
  );
}
