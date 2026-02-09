import { useParams } from 'react-router-dom';
import { ProgressDashboard } from '../components/ProgressDashboard';

export function ProgressDashboardPage() {
  const { planId } = useParams<{ planId?: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {planId ? 'Plan Progress' : 'Progress Dashboard'}
        </h1>
      </div>

      <ProgressDashboard planId={planId} />
    </div>
  );
}
