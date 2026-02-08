import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlanGenerator } from '../components/PlanGenerator';
import { topicsApi } from '../services/topics';

export function PlanGeneratorPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const { data: topicData, isLoading, error } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => topicsApi.getTopic(topicId!),
    enabled: !!topicId,
  });

  const handlePlanGenerated = (planId: string) => {
    navigate(`/plans/${planId}`);
  };

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
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm mb-4">
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Home
          </Link>
          <span className="text-gray-400">›</span>
          <Link
            to={`/topics/${topicId}/resources`}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {topic.name}
          </Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-600">Generate Plan</span>
        </nav>
        <h2 className="text-2xl font-bold text-gray-900">
          Create Learning Plan for: {topic.name}
        </h2>
      </div>

      {/* Plan Generator */}
      <PlanGenerator topicId={topicId} onPlanGenerated={handlePlanGenerated} />
    </div>
  );
}
