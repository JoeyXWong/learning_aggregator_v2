import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { topicsApi } from '../services/topics';

interface TopicSearchProps {
  onTopicCreated: (topicId: string) => void;
}

export function TopicSearch({ onTopicCreated }: TopicSearchProps) {
  const [topicName, setTopicName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState({
    maxResourcesPerSource: 20,
    includeYouTube: true,
    includeGitHub: true,
    minQualityScore: 30,
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; options?: any }) =>
      topicsApi.createTopic(data),
    onSuccess: (data) => {
      onTopicCreated(data.data.topicId);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topicName.trim()) {
      mutation.mutate({
        name: topicName.trim(),
        options: showAdvanced ? options : undefined,
      });
    }
  };

  return (
    <div className="card">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">
        Search for Learning Resources
      </h2>
      <p className="mb-6 text-gray-600">
        Enter a topic you want to learn, and we'll find the best resources for you
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Topic Name
          </label>
          <input
            id="topic"
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="e.g., React Hooks, Machine Learning, API Design"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={mutation.isPending}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {showAdvanced ? '− Hide' : '+ Show'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <div className="grid gap-4 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Resources per Source: {options.maxResourcesPerSource}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={options.maxResourcesPerSource}
                onChange={(e) =>
                  setOptions({ ...options, maxResourcesPerSource: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeYouTube}
                  onChange={(e) =>
                    setOptions({ ...options, includeYouTube: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include YouTube</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeGitHub}
                  onChange={(e) =>
                    setOptions({ ...options, includeGitHub: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include GitHub</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Quality Score: {options.minQualityScore}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={options.minQualityScore}
                onChange={(e) =>
                  setOptions({ ...options, minQualityScore: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !topicName.trim()}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending ? 'Finding Resources...' : 'Find Resources'}
        </button>
      </form>

      {mutation.isError && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{(mutation.error as any)?.message || 'Failed to aggregate resources'}</p>
        </div>
      )}

      {mutation.isSuccess && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-700">
          <p className="font-semibold">Success!</p>
          <p className="text-sm">
            Found {mutation.data.data.resourceCount} resources with an average quality score of{' '}
            {mutation.data.data.averageQualityScore.toFixed(1)}/100
          </p>
        </div>
      )}
    </div>
  );
}
