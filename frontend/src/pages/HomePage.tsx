import { useQuery } from '@tanstack/react-query';
import { TopicSearch } from '../components/TopicSearch';
import { topicsApi } from '../services/topics';
import { plansApi } from '../services/plans';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  // Fetch recent topics
  const { data: topicsData } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsApi.listTopics(),
  });

  // Fetch recent plans
  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.listPlans(),
  });

  const handleTopicCreated = (topicId: string) => {
    navigate(`/topics/${topicId}/resources`);
  };

  const recentTopics = topicsData?.data?.topics?.slice(0, 5) || [];
  const recentPlans = plansData?.data?.plans?.slice(0, 3) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Main Search */}
      <div className="mx-auto max-w-2xl">
        <TopicSearch onTopicCreated={handleTopicCreated} />
      </div>

      {/* Recent Activity */}
      {(recentTopics.length > 0 || recentPlans.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Topics */}
          {recentTopics.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Recent Topics
              </h2>
              <div className="space-y-3">
                {recentTopics.map((topic: any) => (
                  <button
                    key={topic.id}
                    onClick={() => navigate(`/topics/${topic.id}/resources`)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{topic.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(topic.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Plans */}
          {recentPlans.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Recent Learning Plans
              </h2>
              <div className="space-y-3">
                {recentPlans.map((plan: any) => (
                  <button
                    key={plan.id}
                    onClick={() => navigate(`/plans/${plan.id}`)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{plan.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{plan.phases?.length || 0} phases</span>
                      <span>•</span>
                      <span>{plan.totalDuration || 0} hours</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase Status */}
      <div className="mt-12">
        <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
          Development Progress
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <h3 className="text-lg font-semibold text-green-900">Phase 1</h3>
            </div>
            <p className="text-sm text-green-700">
              Foundation & database setup complete
            </p>
          </div>
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <h3 className="text-lg font-semibold text-green-900">Phase 2</h3>
            </div>
            <p className="text-sm text-green-700">
              Resource discovery engine complete
            </p>
          </div>
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <h3 className="text-lg font-semibold text-green-900">Phase 3</h3>
            </div>
            <p className="text-sm text-green-700">
              Learning plan generation complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
