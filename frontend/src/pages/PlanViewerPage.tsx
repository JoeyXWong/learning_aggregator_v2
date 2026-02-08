import { useParams, useNavigate } from 'react-router-dom';
import { PlanViewer } from '../components/PlanViewer';

export function PlanViewerPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  if (!planId) {
    return (
      <div className="card bg-red-50">
        <p className="text-red-700 mb-4">Invalid plan ID</p>
        <button
          onClick={handleBack}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Go Back to Home
        </button>
      </div>
    );
  }

  return <PlanViewer planId={planId} onBack={handleBack} />;
}
