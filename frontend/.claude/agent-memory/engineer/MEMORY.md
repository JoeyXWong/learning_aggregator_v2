# Learning Aggregator V2 - Frontend Engineer Memory

## Project Structure

### Technology Stack
- **React 18** with TypeScript
- **React Router v7** for client-side routing
- **React Query (TanStack Query)** for server state management
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling
- **Axios** for HTTP requests

### Directory Layout
```
/frontend/src/
  /components/     - Reusable UI components (TopicSearch, ResourceList, etc.)
  /pages/          - Route-level page components
  /services/       - API client services (topics, plans, resources)
  /styles/         - Global styles
```

## Routing Architecture

### Route Structure
- `/` - HomePage (TopicSearch + recent activity)
- `/topics/:topicId/resources` - ResourcesPage (resource list for a topic)
- `/topics/:topicId/plan` - PlanGeneratorPage (plan generation form)
- `/plans/:planId` - PlanViewerPage (displays a learning plan)
- `*` - NotFoundPage (404)

### Data Flow Pattern
- Pages use useParams() to get URL parameters
- Pages fetch their own data using React Query hooks
- Navigation uses useNavigate() for programmatic redirects
- Links use <Link> component for declarative navigation

## Build & Development

### Commands
- npm run dev - Start development server (port 5173)
- npm run build - Build for production (outputs to /dist)
- npm run preview - Preview production build

### SPA Routing in Production
- /public/_redirects - For Netlify deployments
- /vercel.json - For Vercel deployments
- Server must serve index.html for all routes
