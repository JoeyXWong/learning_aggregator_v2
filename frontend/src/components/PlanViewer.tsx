import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi, type LearningPlan } from '../services/plans';

interface PlanViewerProps {
  planId: string;
  onBack: () => void;
}

export function PlanViewer({ planId, onBack }: PlanViewerProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => plansApi.getPlan(planId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => plansApi.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      onBack();
    },
  });

  const handleExport = async () => {
    try {
      const blob = await plansApi.exportPlan(planId, 'markdown');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-plan-${planId}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export plan:', error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this learning plan?')) {
      deleteMutation.mutate();
    }
  };

  const togglePhase = (order: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading learning plan...</span>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="card bg-red-50">
        <p className="text-red-700">Failed to load learning plan</p>
        <button
          onClick={onBack}
          className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const plan: LearningPlan = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {plan.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-medium">Duration:</span>
                <span>{plan.totalDuration} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Phases:</span>
                <span>{plan.phases.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Progress:</span>
                <span>{plan.completionPercentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">
              {plan.completionPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${plan.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Preferences */}
        {plan.preferences && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Your Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {plan.preferences.freeOnly && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Free Resources Only
                </span>
              )}
              {plan.preferences.pace && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Pace: {plan.preferences.pace}
                </span>
              )}
              {plan.preferences.preferredTypes &&
                plan.preferences.preferredTypes.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Types: {plan.preferences.preferredTypes.join(', ')}
                  </span>
                )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
          >
            Export as Markdown
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Plan'}
          </button>
        </div>
      </div>

      {/* Learning Path Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Learning Path</h2>

        {plan.phases.map((phase) => (
          <div key={phase.order} className="card">
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(phase.order)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {phase.order}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {phase.name}
                  </h3>
                  <p className="text-sm text-gray-600">{phase.description}</p>
                  <div className="mt-1 text-xs text-gray-500">
                    {phase.estimatedHours} hours • {phase.resources.length} resources
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedPhases.has(phase.order) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Phase Resources */}
            {expandedPhases.has(phase.order) && (
              <div className="mt-6 space-y-3 pl-14">
                {phase.resources.map((resource, idx) => (
                  <div
                    key={resource.resourceId}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-500">
                            {idx + 1}.
                          </span>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            {resource.title}
                          </a>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {resource.type}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              resource.difficulty === 'beginner'
                                ? 'bg-green-100 text-green-800'
                                : resource.difficulty === 'intermediate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : resource.difficulty === 'advanced'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {resource.difficulty}
                          </span>
                          {resource.duration && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {resource.duration} min
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 italic">
                          {resource.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="card bg-gradient-to-r from-indigo-50 to-blue-50">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Tip:</span> Follow the phases in order for the
          best learning experience. Each phase builds on the knowledge from previous
          phases.
        </p>
      </div>
    </div>
  );
}
