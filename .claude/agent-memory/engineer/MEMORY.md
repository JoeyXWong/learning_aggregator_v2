# Learning Aggregator V2 - Project Memory

## Project Overview
Full-stack learning resource aggregator with AI-powered learning plan generation.

## Architecture
- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL (in /backend)
- **Frontend**: React 18 + TypeScript + React Router v7 + React Query + Vite (in /frontend)

## Frontend Recent Changes (2024-02-07)

### React Router Refactoring
- Migrated from manual view state management to React Router v7
- Created 5 page components in src/pages/
- Simplified App.tsx by removing ~100 lines of state management
- Added proper URL-based navigation with shareable links
- Configured SPA routing for production (Netlify/Vercel)

### Key Files
- /frontend/src/pages/ - Route-level components
- /frontend/src/components/ - Reusable UI components
- /frontend/REFACTOR_SUMMARY.md - Detailed refactoring notes
- /frontend/ROUTING_GUIDE.md - Navigation flow documentation

## Backend Structure
- Located in /backend directory
- Separate from frontend build/deployment

## Build Commands
Frontend:
- npm run dev (port 5173)
- npm run build
- npm run preview

Backend:
- Refer to /backend/README.md
