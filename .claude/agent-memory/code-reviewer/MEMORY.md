# Learning Aggregator V2 - Code Reviewer Memory

## Project Overview
- Node.js/Express/TypeScript backend with React/Vite/Tailwind frontend
- Prisma ORM with SQLite database
- External APIs: YouTube Data API v3, GitHub Search API, Claude (Anthropic) API
- Zod for request validation, Winston for logging, Helmet + CORS + rate-limiting for security

## Architecture
- Backend: `backend/src/` with services, routes, middleware, config, utils, types
- Frontend: `frontend/src/` with components, services
- Database: Prisma schema at `backend/prisma/schema.prisma`
- Models: Topic, Resource, TopicResource (junction), LearningPlan, ProgressEntry

## Key Findings (2026-02-07 Review)
- See `review-findings.md` for complete list
- Critical: Error messages leak internal details in production (error.message exposed in all 500 responses)
- Critical: Claude API JSON.parse on LLM output with no validation or try/catch around the parse
- Warning: In-memory cache in AggregatorService with no size bounds (memory leak potential)
- Warning: Sequential DB writes in storeResources loop (N+1 upserts)
- Warning: Only 1 test file exists (classifier.service.test.ts); no route, service integration, or frontend tests
- Warning: Pervasive use of `any` types across services and routes

## Testing Conventions
- Jest with ts-jest, tests in `__tests__/` directories
- Only classifier.service has tests; aggregator, plan-generator, youtube, github services have none
- No route/integration tests despite supertest being a devDependency
- No frontend tests at all

## Code Style
- Consistent Express route handler pattern with Zod validation
- Services exported as singletons (class instances)
- Error handling: try/catch in every handler but errors re-thrown or returned with raw message
- asyncHandler utility exists but only used in health route
