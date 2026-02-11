import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { api } from './services/api';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { ResourcesPage } from './pages/ResourcesPage';
import { PlanGeneratorPage } from './pages/PlanGeneratorPage';
import { PlanViewerPage } from './pages/PlanViewerPage';
import { ProgressDashboardPage } from './pages/ProgressDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking...');

  const { data: healthData, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health'),
  });

  useEffect(() => {
    if (isLoading) {
      setApiStatus('checking...');
    } else if (error) {
      setApiStatus('disconnected');
    } else if (healthData?.data?.success) {
      setApiStatus('connected');
    }
  }, [healthData, isLoading, error]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Learning Aggregator V2
                  </h1>
                  <p className="text-sm text-gray-600">
                    Discover the best learning resources for any topic
                  </p>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    to="/"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/progress"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    Progress
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    apiStatus === 'connected'
                      ? 'bg-green-500'
                      : apiStatus === 'disconnected'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                />
                <span className="text-xs text-gray-600">{apiStatus}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
            <Route path="/topics/:topicId/resources" element={<ErrorBoundary><ResourcesPage /></ErrorBoundary>} />
            <Route path="/topics/:topicId/plan" element={<ErrorBoundary><PlanGeneratorPage /></ErrorBoundary>} />
            <Route path="/plans/:planId" element={<ErrorBoundary><PlanViewerPage /></ErrorBoundary>} />
            <Route path="/progress/:planId?" element={<ErrorBoundary><ProgressDashboardPage /></ErrorBoundary>} />
            <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-indigo-200 bg-white/50 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600">
            <p>
              Learning Aggregator V2 - Built with React, TypeScript, Express, and Prisma
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
