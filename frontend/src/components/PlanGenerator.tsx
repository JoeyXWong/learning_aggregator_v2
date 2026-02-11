import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { plansApi, type PlanPreferences } from '../services/plans';

interface PlanGeneratorProps {
  topicId: string;
  onPlanGenerated: (planId: string) => void;
}

export function PlanGenerator({ topicId, onPlanGenerated }: PlanGeneratorProps) {
  const [preferences, setPreferences] = useState<PlanPreferences>({
    freeOnly: false,
    pace: 'moderate',
    preferredTypes: [],
  });

  const generateMutation = useMutation({
    mutationFn: () => plansApi.generatePlan({ topicId, preferences }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        onPlanGenerated(response.data.id);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate();
  };

  const resourceTypes = [
    { value: 'video', label: 'Videos' },
    { value: 'course', label: 'Courses' },
    { value: 'article', label: 'Articles' },
    { value: 'tutorial', label: 'Tutorials' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'repository', label: 'Repositories' },
  ];

  const toggleResourceType = (type: string) => {
    setPreferences((prev) => {
      const types = prev.preferredTypes || [];
      if (types.includes(type)) {
        return {
          ...prev,
          preferredTypes: types.filter((t) => t !== type),
        };
      } else {
        return {
          ...prev,
          preferredTypes: [...types, type],
        };
      }
    });
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generate Learning Plan
        </h2>
        <p className="text-gray-600">
          Customize your learning preferences and we'll create a personalized learning path.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Free Only Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label htmlFor="freeOnly" className="font-medium text-gray-900">
              Free Resources Only
            </label>
            <p className="text-sm text-gray-600">
              Only include resources that are completely free
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="freeOnly"
              checked={preferences.freeOnly}
              onChange={(e) =>
                setPreferences({ ...preferences, freeOnly: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Learning Pace */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Learning Pace
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['casual', 'moderate', 'intensive'] as const).map((pace) => (
              <button
                key={pace}
                type="button"
                onClick={() => setPreferences({ ...preferences, pace })}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  preferences.pace === pace
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-sm capitalize">{pace}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {pace === 'casual' && '5-10 hrs/week'}
                  {pace === 'moderate' && '10-20 hrs/week'}
                  {pace === 'intensive' && '20+ hrs/week'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Resource Types */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Preferred Resource Types (Optional)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Leave empty to include all types
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {resourceTypes.map((type) => (
              <label
                key={type.value}
                className={`flex items-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  preferences.preferredTypes?.includes(type.value)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={preferences.preferredTypes?.includes(type.value)}
                  onChange={() => toggleResourceType(type.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {generateMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Failed to generate learning plan. Please try again.
            </p>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
          >
            {generateMutation.isPending ? (
              <span className="flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Plan...
              </span>
            ) : (
              'Generate Learning Plan'
            )}
          </button>
        </div>

        {/* Generation Progress Message */}
        {generateMutation.isPending && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
            <p className="text-sm font-medium text-indigo-900">
              Analyzing resources and building your personalized learning plan...
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              This typically takes 15-25 seconds. Please don't close this page.
            </p>
          </div>
        )}
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">
          How it works
        </h4>
        <p className="text-xs text-blue-700">
          We'll analyze the resources we found and create a structured learning path
          that progresses from beginner to advanced topics, optimized for your preferences.
        </p>
      </div>
    </div>
  );
}
