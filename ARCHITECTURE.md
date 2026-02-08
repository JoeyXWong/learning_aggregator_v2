# System Architecture - Learning Aggregator V2

## Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript 5+
- **Framework**: Express.js 4.x
- **ORM**: Prisma 5.x
- **Validation**: Zod for runtime type validation
- **Testing**: Jest + Supertest

**Justification**:
- Fast MVP development with TypeScript safety
- Excellent async/await support for parallel API calls and web scraping
- Rich ecosystem for integrations (axios, cheerio, playwright)
- Easy AI/LLM SDK integration
- Strong community and mature tooling

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: shadcn/ui (customizable Radix UI components)
- **State Management**: React Context + React Query for server state
- **Routing**: React Router 6.x
- **Testing**: Vitest + React Testing Library

**Justification**:
- Component-based architecture fits UI requirements
- Vite provides instant HMR for fast development
- Tailwind enables rapid responsive design
- React Query handles API caching and loading states elegantly
- Large ecosystem for PDF generation (react-pdf) and export features

### Database
- **Primary DB**: PostgreSQL 15+
- **ORM**: Prisma (type-safe queries, migrations)
- **Caching**: Redis (optional for MVP, planned for Phase 2)

**Justification**:
- JSONB columns for flexible resource metadata
- Full-text search for resources
- Robust relational model for plans and progress
- Prisma provides type-safety from DB to API
- Easy to scale and backup

### AI/LLM Integration
- **Primary**: Anthropic Claude API (Claude 3.5 Sonnet)
- **SDK**: @anthropic-ai/sdk
- **Use Cases**:
  - Learning plan generation and subtopic breakdown
  - Resource summarization and quality assessment
  - Difficulty level inference

**Justification**:
- Superior reasoning for structured learning path generation
- Long context window for analyzing multiple resources
- Cost-effective compared to GPT-4
- Reliable API with good rate limits

### External APIs & Data Sources
- **YouTube Data API**: Video resources
- **GitHub API**: Repository discovery for coding topics
- **Web Scraping**: Cheerio/Playwright for sites without APIs
  - Udemy, Coursera, FreeCodeCamp, MDN, etc.
- **Fallback Strategy**: Cached data + graceful degradation

### Deployment & Infrastructure
- **Hosting**: Railway or Render (all-in-one platform)
- **Frontend**: Static build deployed to same platform or Vercel
- **Database**: Managed PostgreSQL on hosting platform
- **CI/CD**: GitHub Actions
- **Monitoring**: Platform-native monitoring + Sentry for errors

**Justification**:
- Simple deployment for MVP
- Affordable pricing
- Built-in PostgreSQL
- Easy environment management
- Quick scaling path

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           React SPA (Vite + TypeScript)                   │  │
│  │                                                             │  │
│  │  • Topic Search UI          • Progress Dashboard          │  │
│  │  • Resource Filters         • Export Controls             │  │
│  │  • Learning Plan Viewer     • Settings Panel              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             │ HTTPS / REST API                   │
│                             ▼                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Express.js API Server (TypeScript)                │  │
│  │                                                             │  │
│  │  • Request Validation (Zod)                               │  │
│  │  • Rate Limiting                                           │  │
│  │  • CORS Configuration                                      │  │
│  │  • Error Handling Middleware                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                         │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │   Resource       │  │  Learning Plan   │  │   Progress    │ │
│  │   Service        │  │  Generator       │  │   Tracker     │ │
│  │                  │  │                  │  │               │ │
│  │ • Discovery      │  │ • Plan Creation  │  │ • Status Mgmt │ │
│  │ • Classification │  │ • Sequencing     │  │ • Notes       │ │
│  │ • Quality Score  │  │ • Customization  │  │ • Stats       │ │
│  └─────────────────┘  └──────────────────┘  └───────────────┘ │
│           │                     │                     │          │
│           └─────────────────────┴─────────────────────┘          │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                      │
        ▼                     ▼                      ▼
┌──────────────┐    ┌──────────────────┐   ┌────────────────┐
│   External   │    │   AI/LLM Layer   │   │   Data Layer   │
│   APIs       │    │                  │   │                │
│              │    │  Claude API      │   │  PostgreSQL    │
│ • YouTube    │    │  • Plan Gen      │   │  (Prisma)      │
│ • GitHub     │    │  • Subtopics     │   │                │
│ • Scrapers   │    │  • Summary       │   │ • Topics       │
│              │    │  • Difficulty    │   │ • Resources    │
└──────────────┘    └──────────────────┘   │ • Plans        │
                                             │ • Progress     │
                                             └────────────────┘
```

---

## Key User Flows & Data Flow

### 1. Topic Search → Resource Aggregation

```
User enters topic "React Hooks"
    ↓
Frontend validates & sends POST /api/topics
    ↓
Backend creates Topic record, starts aggregation job
    ↓
Parallel resource discovery:
    ├─→ YouTube API (search "React Hooks tutorial")
    ├─→ GitHub API (search repos with "react hooks")
    ├─→ Web scrapers (Udemy, Coursera, FreeCodeCamp)
    └─→ Documentation sites (MDN, React docs)
    ↓
Resource Classification Service:
    ├─→ Extract metadata (title, description, URL)
    ├─→ Detect resource type (video, article, course)
    ├─→ Infer difficulty (keywords, description analysis)
    ├─→ Detect pricing (free/premium)
    └─→ Calculate quality score (ratings, date, platform)
    ↓
Deduplicate resources (same URL or very similar)
    ↓
Store resources in database linked to Topic
    ↓
Return resource list to frontend (with filter metadata)
    ↓
User views resources, applies filters
```

**Performance Target**: 20-30 seconds for 50+ resources

---

### 2. Learning Plan Generation

```
User clicks "Generate Plan" with preferences
    ↓
Frontend sends POST /api/plans/generate
    {
      topicId: "uuid",
      preferences: {
        freeOnly: true,
        pace: "moderate",
        preferredTypes: ["video", "tutorial"]
      }
    }
    ↓
Backend fetches resources for topic
    ↓
Learning Plan Generator Service:
    ├─→ Filter resources by preferences
    ├─→ Send to Claude API for subtopic breakdown:
    │   "Given these resources about React Hooks,
    │    organize them into logical subtopics and
    │    create a learning sequence from beginner to advanced"
    │
    ├─→ Claude returns structured plan:
    │   {
    │     subtopics: [
    │       {name: "useState Basics", resources: [...], order: 1},
    │       {name: "useEffect Deep Dive", resources: [...], order: 2},
    │       ...
    │     ]
    │   }
    │
    ├─→ Sequence resources within each subtopic
    ├─→ Calculate time estimates per phase
    └─→ Generate completion timeline based on pace
    ↓
Store Learning Plan in database
    ↓
Return structured plan to frontend
    ↓
User views interactive timeline, can export
```

**Performance Target**: 15-30 seconds for plan generation

---

### 3. Progress Tracking

```
User marks resource as "In Progress" or "Completed"
    ↓
Frontend sends POST /api/progress
    {
      planId: "uuid",
      resourceId: "uuid",
      status: "completed",
      notes: "Great explanation of closure"
    }
    ↓
Backend updates Progress record
    ↓
Recalculate plan completion percentage
    ↓
Return updated progress stats
    ↓
Frontend updates UI:
    ├─→ Checkmark on resource
    ├─→ Progress bar updates
    └─→ Dashboard stats refresh
```

**Performance Target**: <500ms response time

---

## API Structure (RESTful)

### Topic & Resource Endpoints

```
POST   /api/topics
  Body: { name: "React Hooks" }
  Response: { topicId, status: "aggregating" }

GET    /api/topics/:topicId/resources
  Query: ?type=video&difficulty=beginner&free=true
  Response: { resources: [...], metadata: { totalCount, filters } }

GET    /api/resources/:resourceId
  Response: { id, title, description, url, type, difficulty, ... }
```

### Learning Plan Endpoints

```
POST   /api/plans/generate
  Body: { topicId, preferences: {...} }
  Response: { planId, subtopics: [...], totalDuration, timeline }

GET    /api/plans/:planId
  Response: { plan details, resources, progress }

GET    /api/plans/:planId/export?format=markdown
  Response: File download (markdown/pdf)
```

### Progress Endpoints

```
POST   /api/progress
  Body: { planId, resourceId, status, notes }
  Response: { success, updatedProgress }

GET    /api/progress/:planId
  Response: {
    completionPercentage,
    resourceStatuses: [...],
    stats: { completedCount, inProgressCount, timeSpent }
  }
```

---

## Caching Strategy

### Resource Data Caching
- **Cache Layer**: In-memory Node cache (MVP) → Redis (Phase 2+)
- **Cache Duration**:
  - Topic resources: 7 days
  - Resource details: 30 days
  - External API responses: 1 hour
- **Invalidation**: Manual refresh button + periodic background refresh
- **Fallback**: Serve stale data if external APIs fail

### Frontend Caching
- **React Query**:
  - Stale time: 5 minutes
  - Cache time: 30 minutes
  - Background refetch on window focus
- **LocalStorage**:
  - Saved plans (entire plan object)
  - User preferences
  - Progress data (synced to backend if authenticated)

---

## Resource Aggregation Strategy

### Data Sources Priority (MVP)

**Tier 1 - API Integrations** (Reliable, structured data)
1. **YouTube Data API**: Videos, duration, ratings, view count
2. **GitHub API**: Repositories, stars, last updated
3. **MDN Web Docs**: Official documentation (scraping)

**Tier 2 - Web Scraping** (Fallback, requires parsing)
1. **FreeCodeCamp**: Free courses and tutorials
2. **Udemy**: Course metadata (title, rating, price, duration)
3. **Coursera**: Course listings and difficulty

**Tier 3 - Community Curated** (Future enhancement)
- Reddit threads, DEV.to articles, Hacker News discussions

### Scraping Approach
- **Tools**: Cheerio for static content, Playwright for JavaScript-heavy sites
- **Rate Limiting**: Max 10 requests/second per domain
- **User Agent**: Identify as educational research tool
- **Error Handling**: Fail gracefully, log failures, don't block plan generation
- **Robots.txt Compliance**: Respect crawl delays and restrictions

### Deduplication Logic
```typescript
function deduplicateResources(resources: Resource[]): Resource[] {
  // 1. Exact URL match
  // 2. Normalize URLs (remove tracking params, www, etc.)
  // 3. Title similarity (Levenshtein distance > 0.85)
  // 4. Prefer higher quality source (official > course platform > blog)
}
```

---

## Authentication Approach

### MVP (Phases 1-5): No Authentication
- **Storage**: localStorage for all user data
- **Limitations**: Single-device, no cloud sync
- **Benefits**: Zero friction, immediate use
- **Data**: Plans, progress, preferences stored client-side

### Post-MVP (Phase 9+): Optional Accounts
- **Strategy**: Email + magic link (passwordless)
- **Provider**: Supabase Auth or Auth0
- **Migration**: Import localStorage data on first login
- **Benefits**: Multi-device sync, plan sharing, backup

---

## Quality & Difficulty Detection

### Resource Type Classification
```typescript
function classifyResourceType(resource: RawResource): ResourceType {
  const url = resource.url.toLowerCase();
  const title = resource.title.toLowerCase();

  if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'video';
  if (url.includes('github.com')) return 'project';
  if (url.includes('/docs/') || url.includes('developer.mozilla')) return 'documentation';
  if (title.includes('course') || resource.duration > 10) return 'course';
  if (resource.pageCount || title.includes('book')) return 'book';

  // Default based on length
  return resource.estimatedReadTime < 30 ? 'article' : 'tutorial';
}
```

### Difficulty Detection
```typescript
function detectDifficulty(resource: RawResource): Difficulty {
  const signals = {
    beginner: ['beginner', 'introduction', 'getting started', 'basics', '101'],
    advanced: ['advanced', 'expert', 'mastery', 'deep dive', 'internals'],
    intermediate: ['intermediate', 'practical', 'real-world']
  };

  const description = resource.description.toLowerCase();

  // Check explicit keywords
  if (signals.beginner.some(kw => description.includes(kw))) return 'beginner';
  if (signals.advanced.some(kw => description.includes(kw))) return 'advanced';

  // Analyze prerequisites mentioned
  const prerequisiteCount = countPrerequisites(description);
  if (prerequisiteCount === 0) return 'beginner';
  if (prerequisiteCount > 3) return 'advanced';

  return 'intermediate';
}
```

### Quality Score Algorithm
```typescript
function calculateQualityScore(resource: Resource): number {
  let score = 0;

  // Rating signal (0-40 points)
  if (resource.rating) {
    score += (resource.rating / 5) * 40;
  }

  // Popularity signal (0-25 points)
  const popularityScore = Math.min(
    Math.log10(resource.viewCount || resource.stars || 1) / 6,
    1
  );
  score += popularityScore * 25;

  // Recency signal (0-20 points)
  const ageInYears = (Date.now() - resource.publishDate) / (365 * 24 * 60 * 60 * 1000);
  const recencyScore = Math.max(0, 1 - (ageInYears / 3)); // Decay over 3 years
  score += recencyScore * 20;

  // Platform reputation (0-15 points)
  const platformScores = {
    'youtube.com': 10,
    'github.com': 15,
    'developer.mozilla.org': 15,
    'coursera.org': 12,
    'udemy.com': 10,
    'freecodecamp.org': 14
  };
  score += platformScores[extractDomain(resource.url)] || 5;

  return Math.round(score);
}
```

---

## Error Handling & Resilience

### API Error Handling
```typescript
// Layered error handling approach
try {
  const resources = await aggregateResources(topic);
} catch (error) {
  if (error instanceof ExternalAPIError) {
    // Log error, return cached data if available
    logger.error('External API failed', { error, topic });
    return getCachedResources(topic) || [];
  }
  if (error instanceof RateLimitError) {
    // Return partial results, notify user
    return {
      resources: partialResults,
      warning: 'Some sources unavailable due to rate limits'
    };
  }
  throw error; // Unexpected errors propagate
}
```

### Graceful Degradation
1. **Primary source fails**: Continue with available sources
2. **All sources fail**: Return cached data with staleness warning
3. **No cached data**: Provide manual resource addition option
4. **Plan generation fails**: Offer basic plan based on resource types

### User-Facing Error Messages
```typescript
const errorMessages = {
  TOPIC_NOT_FOUND: 'No resources found for this topic. Try a related topic or broader search.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  NETWORK_ERROR: 'Connection issue. Check your internet and retry.',
  GENERATION_FAILED: 'Plan generation encountered an issue. Please try again or contact support.',
};
```

---

## Performance Considerations

### Backend Optimization
- **Parallel API Calls**: Use Promise.all() for concurrent resource fetching
- **Database Indexing**: Index topic name, resource URL, difficulty, type
- **Query Optimization**: Use Prisma's `include` efficiently, avoid N+1 queries
- **Response Compression**: gzip compression for large resource lists

### Frontend Optimization
- **Code Splitting**: Lazy load export components, settings panel
- **Virtual Scrolling**: For resource lists >100 items
- **Image Lazy Loading**: Resource thumbnails load on scroll
- **Debounced Search**: 300ms debounce on filter inputs
- **Optimistic Updates**: Instant UI feedback for progress updates

### Caching Strategy
- **Resource Lists**: Cache for 5 minutes (React Query)
- **Plan Details**: Cache indefinitely, invalidate on update
- **API Responses**: Cache at nginx/platform level (future)

---

## Security Considerations

### Input Validation
- **Zod schemas** for all API inputs
- **SQL Injection**: Prevented by Prisma ORM
- **XSS Prevention**: React escapes by default, sanitize markdown exports
- **CORS**: Whitelist frontend domain only

### API Security
- **Rate Limiting**: 100 requests/hour per IP (MVP)
- **API Keys**: Environment variables, never in client code
- **HTTPS Only**: Enforce in production
- **Content Security Policy**: Strict CSP headers

### Data Privacy
- **No PII Collection**: Email optional (post-MVP only)
- **localStorage**: Inform users data is local-only
- **Third-party Resources**: Users responsible for external content

---

## Deployment Architecture

### Development Environment
```
Local:
├─ Frontend: http://localhost:5173 (Vite dev server)
├─ Backend: http://localhost:3000 (Express + nodemon)
└─ Database: PostgreSQL on localhost:5432

Environment Variables:
.env.development
  DATABASE_URL=postgresql://...
  CLAUDE_API_KEY=sk-ant-...
  YOUTUBE_API_KEY=...
  NODE_ENV=development
```

### Production Environment (Railway/Render)
```
Production:
├─ Frontend: Static build served by platform CDN
├─ Backend: Node.js server with PM2 process manager
└─ Database: Managed PostgreSQL instance

Environment Variables:
  DATABASE_URL=postgresql://... (managed by platform)
  CLAUDE_API_KEY=... (secret)
  YOUTUBE_API_KEY=... (secret)
  NODE_ENV=production
  FRONTEND_URL=https://learning-aggregator.app
```

---

## Testing Strategy

### Backend Testing
- **Unit Tests**: Services, utilities, classification logic
- **Integration Tests**: API endpoints with test database
- **E2E Tests**: Critical flows (topic search → plan generation)
- **Target Coverage**: 70% minimum

### Frontend Testing
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: User flows with mocked API
- **Visual Regression**: Percy or Chromatic (post-MVP)
- **Accessibility**: axe-core automated testing

---

## Monitoring & Observability

### MVP Monitoring
- **Platform Metrics**: CPU, memory, request count (Railway/Render dashboard)
- **Error Tracking**: Sentry for backend and frontend errors
- **Logging**: Winston logger with structured JSON logs
- **Uptime Monitoring**: UptimeRobot or Pingdom

### Key Metrics to Track
- API response times (p50, p95, p99)
- Resource aggregation success rate
- Plan generation completion rate
- External API failure rate
- User engagement (plans generated, exports)

---

## Future Scalability Path

### Phase 2-3 (100-1000 users)
- Add Redis for caching
- Implement background job queue (BullMQ)
- Database connection pooling
- CDN for static assets

### Phase 4+ (1000+ users)
- Horizontal scaling (multiple backend instances)
- Read replicas for database
- Elasticsearch for resource search
- Microservices architecture (resource aggregator, plan generator as separate services)

---

## Open Questions & Decisions Needed

1. **Rate Limiting Strategy**: How aggressive should rate limiting be? Start with 100 req/hour?
2. **Resource Refresh Frequency**: How often should we re-scrape resources to check for updates?
3. **Plan Versioning**: If plan generation algorithm improves, should we version saved plans?
4. **Manual Resource Addition**: Allow users to suggest resources for a topic?
5. **Quality Threshold**: Minimum quality score to include in plans (e.g., exclude resources <30/100)?

---

**Document Status**: Ready for Implementation
**Last Updated**: 2026-02-07
**Author**: Engineering Team
