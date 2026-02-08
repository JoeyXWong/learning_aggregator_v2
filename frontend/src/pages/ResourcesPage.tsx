import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ResourceList } from '../components/ResourceList';
import { topicsApi } from '../services/topics';

export function ResourcesPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const { data: topicData, isLoading, error } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => topicsApi.getTopic(topicId!),
    enabled: !!topicId,
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading topic...</span>
        </div>
      </div>
    );
  }

  if (error || !topicData?.success || !topicId) {
    return (
      <div className="card bg-red-50">
        <p className="text-red-700 mb-4">Failed to load topic</p>
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Go Back to Home
        </Link>
      </div>
    );
  }

  const topic = topicData.data;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-2 inline-block"
          >
            ← Back to Search
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            Resources for: {topic.name}
          </h2>
        </div>
        <button
          onClick={() => navigate(`/topics/${topicId}/plan`)}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Generate Learning Plan
        </button>
      </div>

      {/* Resource List */}
      <ResourceList topicId={topicId} />
    </div>
  );
}
