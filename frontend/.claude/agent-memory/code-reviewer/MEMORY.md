# Code Reviewer Agent Memory - Learning Aggregator V2 Frontend

## Project Overview
- React 18 + TypeScript + Vite 6 frontend
- Tailwind CSS v3.4 for styling (NOT using shadcn/ui despite some shadcn patterns in CSS)
- React Query (TanStack Query v5) for data fetching
- Axios for HTTP requests
- Vitest for testing

## Key Files
- `/src/styles/index.css` - Global CSS with Tailwind directives and custom component classes
- `/src/services/api.ts` - Axios instance with base URL config
- `/vite.config.ts` - Vite config with proxy for `/api` -> `http://localhost:3000`
- `/tailwind.config.js` - Only extends `primary` color palette (no shadcn/ui CSS variables)

## Known Issues Fixed
- **border-border class error**: The CSS had `@apply border-border` (shadcn/ui pattern) but the Tailwind config did not define a `border` color. Fixed by replacing with `@apply border-gray-200`.
- **CORS issue**: Backend CORS allows `localhost:5173` but Vite may run on 5174. Fixed by changing API base URL from `http://localhost:3000/api` to `/api` to use Vite's built-in proxy.

## Architecture Notes
- Backend runs on port 3000 (Node.js/Express)
- Frontend dev server on port 5173 (or 5174 if 5173 is occupied)
- Vite proxy config routes `/api` requests to backend, avoiding CORS in development
- No `.env` file exists; defaults are used from code

## Patterns & Conventions
- Custom CSS component classes defined in `@layer components` (`.btn`, `.card`, `.input`)
- Base styles defined in `@layer base` for headings and global defaults
- Color scheme: `primary` (sky blue palette), grays for UI chrome
