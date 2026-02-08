import { type ProgressSummary } from '../services/progress';

interface ProgressStatsProps {
  summary: ProgressSummary;
  totalTimeSpent?: number;
}

export function ProgressStats({ summary, totalTimeSpent }: ProgressStatsProps) {
  const formatTime = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined) return '0h 0m';
    if (minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const stats = [
    {
      label: 'Completion',
      value: `${summary.completionPercentage}%`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-indigo-50 text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      label: 'Completed',
      value: `${summary.completedCount} / ${summary.totalResources}`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'In Progress',
      value: summary.inProgressCount.toString(),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-yellow-50 text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Time Spent',
      value: formatTime(totalTimeSpent || summary.totalTimeSpent),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <div className={stat.color}>{stat.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
