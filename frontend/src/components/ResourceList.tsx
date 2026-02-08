import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, type Resource } from '../services/topics';

interface ResourceListProps {
  topicId: string;
}

export function ResourceList({ topicId }: ResourceListProps) {
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    pricing: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['topicResources', topicId, filters],
    queryFn: () => topicsApi.getTopicResources(topicId, filters),
    enabled: !!topicId,
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading resources...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50">
        <p className="text-red-700">Failed to load resources</p>
      </div>
    );
  }

  const resources = data?.data.resources || [];
  const metadata = data?.data.metadata;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Filters</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Types</option>
              {metadata?.types.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.type} ({t.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Levels</option>
              {metadata?.difficulties.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.value} ({d.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing
            </label>
            <select
              value={filters.pricing}
              onChange={(e) => setFilters({ ...filters, pricing: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All</option>
              {metadata?.pricing.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.value} ({p.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resource Count */}
      <div className="text-center">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{resources.length}</span> resources
        </p>
      </div>

      {/* Resources Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      {resources.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No resources match your filters</p>
          <button
            onClick={() => setFilters({ type: '', difficulty: '', pricing: '' })}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const typeColors: Record<string, string> = {
    video: 'bg-red-100 text-red-800',
    repository: 'bg-purple-100 text-purple-800',
    course: 'bg-blue-100 text-blue-800',
    article: 'bg-green-100 text-green-800',
    documentation: 'bg-yellow-100 text-yellow-800',
    tutorial: 'bg-orange-100 text-orange-800',
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  const pricingIcons: Record<string, string> = {
    free: '🆓',
    freemium: '💎',
    premium: '💰',
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex flex-col h-full">
        {/* Type and Quality Score */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
              typeColors[resource.type] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {resource.type}
          </span>
          {resource.qualityScore && (
            <span className="text-xs font-semibold text-gray-600">
              {resource.qualityScore}/100
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="mb-4 text-sm text-gray-600 line-clamp-3 flex-grow">
          {resource.description || 'No description available'}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.difficulty && (
            <span
              className={`inline-block px-2 py-1 text-xs rounded ${
                difficultyColors[resource.difficulty] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {resource.difficulty}
            </span>
          )}
          {resource.pricing && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
              {pricingIcons[resource.pricing]} {resource.pricing}
            </span>
          )}
          {resource.duration && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
              ⏱️ {resource.duration} min
            </span>
          )}
        </div>

        {/* Platform and Link */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">{resource.platform}</span>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View Resource →
          </a>
        </div>
      </div>
    </div>
  );
}
