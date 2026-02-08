# Product Manager Agent Memory - Learning Aggregator V2

## Project Overview
- **Purpose**: Web application that aggregates learning resources and generates personalized learning plans for any topic
- **Target Users**: Self-learners, career switchers, students, hobbyists
- **MVP Scope**: Phases 1-5 (Foundation through Frontend Development)
- **Key Value Prop**: Eliminates overwhelming resource discovery by providing curated, structured learning roadmaps

## Key Documents
- `/Users/joeywong/Documents/GitHub/learning_aggregator_v2/MILESTONES.md`: 9-phase development roadmap with success metrics
- `/Users/joeywong/Documents/GitHub/learning_aggregator_v2/REQUIREMENTS.md`: Complete PRD with user stories, acceptance criteria, edge cases

## Domain Terminology
- **Topic**: Subject matter user wants to learn (e.g., "React", "ML")
- **Resource**: Learning material (video, article, course, book, docs, tutorial, project)
- **Learning Plan**: Structured, sequenced collection of resources organized by subtopics with timelines
- **Subtopic**: Discrete component of larger topic (e.g., "Hooks" for "React")
- **Progress Tracking**: Recording completion status and notes for resources
- **Free/Premium Filter**: Classification indicating payment requirement
- **Difficulty Level**: Beginner, Intermediate, Advanced, Unspecified
- **Resource Type**: Format (Video, Article, Course, Book, Tutorial, Documentation, Project)

## User Types (Primary)
1. **Self-Learners**: Independent learners (primary persona)
2. **Career Switchers**: Professionals transitioning fields
3. **Students**: Academic learners supplementing education
4. **Hobbyists**: Personal interest exploration

## MVP Feature Epics (P0 - Must Have)
1. **Topic Search & Resource Discovery**: Input topic, aggregate resources, filter by free/premium/type/difficulty
2. **Learning Plan Generation**: Generate structured plans with customization, view timeline
3. **Plan Export**: Export as Markdown and PDF
4. **Progress Tracking**: Mark resources started/completed, view progress dashboard, add notes (P1)
5. **Core Infrastructure**: Responsive UI, error handling

## Critical Constraints & Risks
- **External API Dependencies**: Resource discovery relies on external APIs (rate limits, availability)
- **Data Freshness**: Resource metadata becomes stale, needs refresh strategy
- **Link Rot**: External links may break over time
- **Classification Accuracy**: Automated difficulty/type classification may have errors
- **localStorage Limits**: Browser storage typically 5-10MB
- **No Authentication**: MVP uses localStorage only, single-device usage

## Key Assumptions
- Target audience: Tech-savvy adult learners
- English content only for MVP
- Initial focus on tech/programming topics
- Internet connectivity required
- Modern browsers with web standards support
- Free tier APIs have sufficient limits for MVP traffic
- No monetization in MVP

## Success Metrics for MVP
- Resource aggregation for 20+ diverse tech topics
- Plan generation under 30 seconds
- Free/premium classification 90%+ accuracy
- Export in Markdown and PDF formats
- Progress tracking persists via localStorage
- Responsive UI (mobile/tablet/desktop)
- 85%+ resource classification accuracy
- <5% broken links at generation time

## Non-Functional Requirements
- **Performance**: Page load <3s on 3G, plan generation <30s, API p95 <2s
- **Security**: Input sanitization, HTTPS, rate limiting (100 req/hr/IP), CSP headers
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Browser Support**: Latest 2 versions Chrome/Firefox/Safari/Edge

## Out of Scope for MVP
- User authentication/accounts
- Social features (comments, ratings, discussions)
- Collaborative learning (study groups, shared progress)
- Spaced repetition and reminders
- Quizzes/assessments
- Certificate generation
- Mobile native apps
- Offline mode
- Multi-language support
- Advanced AI features (conversational refinement)
- Video playback (links only)

## Tech Stack (DECIDED)
- **Backend**: Node.js/Express/TypeScript
- **Frontend**: React/Vite/Tailwind CSS
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod planned)
- **LLM**: Claude API with fallback to template-based generation
- **State**: React Query for server state
- **Testing**: Jest (backend), Vitest (frontend)

## Current Implementation Status (As of 2026-02-07)
✅ **Phase 1 Complete**: Express server, React app, Prisma schema, health checks
✅ **Phase 2 Complete**: YouTube + GitHub APIs, classifier (type/difficulty/pricing), aggregator, quality scoring
✅ **Phase 3 Complete**: Claude API plan generation, CRUD endpoints, markdown export, frontend components

## Database Schema (Implemented)
- **topics**: id, name, normalizedName, slug, lastAggregatedAt, resourceCount, metadata (JSONB)
- **resources**: title, url, type, difficulty, pricing, platform, duration, rating, qualityScore, metadata (JSONB)
- **topic_resources**: many-to-many join with relevanceScore
- **learning_plans**: topicId, preferences (JSONB), phases (JSONB), totalDuration, completionPercentage
- **progress_entries**: planId, resourceId, status, startedAt, completedAt, notes, timeSpent

## API Endpoints (Implemented)
- POST /api/topics (create + aggregate)
- GET /api/topics/:id/resources (with filters)
- POST /api/plans/generate (with preferences)
- GET /api/plans/:id
- GET /api/plans (list all)
- DELETE /api/plans/:id
- GET /api/plans/:id/export?format=markdown

## Critical Gaps for MVP
1. **Progress tracking endpoints missing** - schema exists, no API implementation
2. **Test coverage 14.85%** (target: 70%) - only classifier.service.test.ts exists
3. **No frontend routing** - React Router installed but unused, all views in App.tsx
4. **Empty pages directory** - no proper page structure
5. **PDF export not implemented** - only markdown works
6. **Only 2 resource sources** - YouTube + GitHub, missing web scraping/Udemy/Coursera/etc
7. **No CI/CD or deployment setup**

## Lessons Learned
- JSONB in Prisma works well for flexible plan phases structure
- Claude API fallback to template-based generation prevents total failures
- Quality scoring combines rating + reviewCount + recency
- Frontend uses single App.tsx with view state (search → resources → plan-generator → plan-viewer)
