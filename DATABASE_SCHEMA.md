# Database Schema Design - Learning Aggregator V2

## Database: PostgreSQL 15+
## ORM: Prisma 5.x

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────────┐
│     Topic       │         │      Resource        │
├─────────────────┤         ├──────────────────────┤
│ id (PK)         │────┐    │ id (PK)              │
│ name            │    │    │ title                │
│ normalizedName  │    │    │ description          │
│ slug            │    │    │ url                  │
│ createdAt       │    │    │ type                 │
│ lastAggregated  │    │    │ difficulty           │
│ resourceCount   │    │    │ pricing              │
│ metadata        │    │    │ platform             │
└─────────────────┘    │    │ duration             │
                       │    │ rating               │
                       │    │ reviewCount          │
                       │    │ publishDate          │
                       │    │ lastVerified         │
                       │    │ qualityScore         │
                       │    │ thumbnailUrl         │
                       │    │ metadata (JSONB)     │
                       │    │ createdAt            │
                       │    │ updatedAt            │
                       │    └──────────────────────┘
                       │              │
                       │              │
                       ▼              ▼
            ┌──────────────────────────────┐
            │    TopicResource (Join)      │
            ├──────────────────────────────┤
            │ id (PK)                      │
            │ topicId (FK)                 │
            │ resourceId (FK)              │
            │ relevanceScore               │
            │ createdAt                    │
            └──────────────────────────────┘
                       │
                       │
                       ▼
            ┌─────────────────────┐
            │   LearningPlan      │
            ├─────────────────────┤
            │ id (PK)             │
            │ topicId (FK)        │
            │ title               │
            │ preferences (JSONB) │
            │ phases (JSONB)      │──────┐
            │ totalDuration       │      │
            │ createdAt           │      │
            │ updatedAt           │      │
            └─────────────────────┘      │
                       │                 │
                       │                 │
                       ▼                 ▼
            ┌─────────────────────┐   ┌──────────────────┐
            │   ProgressEntry     │   │  PlanResource    │
            ├─────────────────────┤   │  (Denormalized)  │
            │ id (PK)             │   ├──────────────────┤
            │ planId (FK)         │   │ planId           │
            │ resourceId (FK)     │   │ resourceId       │
            │ status              │   │ phaseIndex       │
            │ startedAt           │   │ orderInPhase     │
            │ completedAt         │   └──────────────────┘
            │ notes               │
            │ timeSpent           │
            │ createdAt           │
            │ updatedAt           │
            └─────────────────────┘
```

---

## Table Definitions

### 1. `topics`
Stores learning topics submitted by users.

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_aggregated_at TIMESTAMP WITH TIME ZONE,
  resource_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_topics_normalized_name ON topics(normalized_name);
CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_last_aggregated ON topics(last_aggregated_at);
```

**Columns**:
- `id`: UUID primary key
- `name`: Original topic name as entered by user (e.g., "React Hooks")
- `normalized_name`: Lowercase, trimmed for deduplication (e.g., "react hooks")
- `slug`: URL-safe identifier (e.g., "react-hooks")
- `created_at`: When the topic was first submitted
- `last_aggregated_at`: Last time resources were fetched for this topic
- `resource_count`: Cached count of associated resources
- `metadata`: Additional flexible data (e.g., `{ "aliases": ["reactjs hooks"], "category": "frontend" }`)

**Indexes**:
- `normalized_name`: Fast lookup for duplicate topics
- `slug`: For URL routing
- `last_aggregated_at`: For refresh logic

---

### 2. `resources`
Stores learning resources discovered from various platforms.

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  url VARCHAR(2048) NOT NULL UNIQUE,
  normalized_url VARCHAR(2048) NOT NULL,

  -- Classification
  type VARCHAR(50) NOT NULL,  -- 'video', 'article', 'course', 'book', 'tutorial', 'documentation', 'project'
  difficulty VARCHAR(50),     -- 'beginner', 'intermediate', 'advanced', 'unspecified'
  pricing VARCHAR(50),        -- 'free', 'freemium', 'premium', 'unknown'
  platform VARCHAR(100),      -- 'youtube', 'github', 'udemy', 'coursera', 'freecodecamp', etc.

  -- Metrics
  duration INTEGER,           -- Duration in minutes
  rating DECIMAL(3,2),        -- Rating out of 5.00
  review_count INTEGER,       -- Number of reviews/ratings
  view_count INTEGER,         -- Views, enrollments, or stars

  -- Dates
  publish_date TIMESTAMP WITH TIME ZONE,
  last_updated_date TIMESTAMP WITH TIME ZONE,
  last_verified_at TIMESTAMP WITH TIME ZONE,  -- Last time we verified the URL is live

  -- Quality
  quality_score INTEGER,      -- Computed score 0-100

  -- Media
  thumbnail_url VARCHAR(2048),

  -- Metadata
  metadata JSONB DEFAULT '{}',  -- Flexible data: author, prerequisites, tags, etc.

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_url ON resources(url);
CREATE INDEX idx_resources_normalized_url ON resources(normalized_url);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_difficulty ON resources(difficulty);
CREATE INDEX idx_resources_pricing ON resources(pricing);
CREATE INDEX idx_resources_platform ON resources(platform);
CREATE INDEX idx_resources_quality_score ON resources(quality_score DESC);
CREATE INDEX idx_resources_rating ON resources(rating DESC);

-- Full-text search index
CREATE INDEX idx_resources_search ON resources USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);
```

**Columns**:
- `id`: UUID primary key
- `title`: Resource title (max 500 chars)
- `description`: Full description or summary
- `url`: Original URL
- `normalized_url`: Cleaned URL for deduplication (no tracking params, www, etc.)
- `type`: Resource format
- `difficulty`: Skill level required
- `pricing`: Cost classification
- `platform`: Source platform
- `duration`: Estimated time in minutes
- `rating`: Average rating (0.00-5.00)
- `review_count`: Number of reviews
- `view_count`: Popularity metric (views, stars, enrollments)
- `publish_date`: When resource was published
- `last_updated_date`: When resource content was last updated
- `last_verified_at`: Last time we checked the URL works
- `quality_score`: Computed 0-100 score based on algorithm
- `thumbnail_url`: Preview image
- `metadata`: JSON object for platform-specific data
  ```json
  {
    "author": "Traversy Media",
    "language": "en",
    "prerequisites": ["JavaScript Basics"],
    "tags": ["react", "hooks", "useState", "useEffect"],
    "courseLength": "4 hours",
    "level": "intermediate"
  }
  ```

**Indexes**:
- URL indexes for fast lookup and deduplication
- Classification fields for filtering
- Quality/rating for sorting
- Full-text search for content queries

---

### 3. `topic_resources`
Many-to-many relationship between topics and resources.

```sql
CREATE TABLE topic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  relevance_score DECIMAL(5,2),  -- How relevant this resource is to the topic (0-100)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(topic_id, resource_id)
);

CREATE INDEX idx_topic_resources_topic ON topic_resources(topic_id);
CREATE INDEX idx_topic_resources_resource ON topic_resources(resource_id);
CREATE INDEX idx_topic_resources_relevance ON topic_resources(relevance_score DESC);
```

**Purpose**:
- Same resource can be relevant to multiple topics
- Allows tracking relevance score per topic-resource pair
- Enables efficient querying of resources for a topic

---

### 4. `learning_plans`
Stores generated learning plans.

```sql
CREATE TABLE learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,

  -- User preferences used to generate this plan
  preferences JSONB NOT NULL,  -- { freeOnly, pace, preferredTypes, skillLevel }

  -- Plan structure
  phases JSONB NOT NULL,  -- Array of phases with resources

  -- Metrics
  total_duration INTEGER,  -- Total estimated minutes
  completion_percentage DECIMAL(5,2) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_learning_plans_topic ON learning_plans(topic_id);
CREATE INDEX idx_learning_plans_created ON learning_plans(created_at DESC);
```

**Columns**:
- `id`: UUID primary key
- `topic_id`: Reference to the topic
- `title`: Plan title (e.g., "React Hooks Learning Path")
- `preferences`: JSON of generation preferences
  ```json
  {
    "freeOnly": true,
    "pace": "moderate",  // casual=5hrs/week, moderate=10hrs/week, intensive=20hrs/week
    "preferredTypes": ["video", "tutorial"],
    "skillLevel": "beginner"
  }
  ```
- `phases`: Array of learning phases
  ```json
  [
    {
      "name": "useState Fundamentals",
      "order": 1,
      "duration": 180,  // minutes
      "resources": [
        {
          "resourceId": "uuid-1",
          "order": 1,
          "notes": "Start here for basics"
        },
        {
          "resourceId": "uuid-2",
          "order": 2
        }
      ]
    },
    {
      "name": "useEffect Deep Dive",
      "order": 2,
      "duration": 240,
      "resources": [...]
    }
  ]
  ```
- `total_duration`: Sum of all phase durations
- `completion_percentage`: Calculated from progress entries

**Why JSONB for phases?**
- Flexible structure for different plan types
- Efficient storage and querying with PostgreSQL JSONB
- Avoids complex joins for simple plan retrieval
- Easy to export to JSON/Markdown/PDF

---

### 5. `progress_entries`
Tracks user progress through learning plan resources.

```sql
CREATE TABLE progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Progress tracking
  status VARCHAR(50) NOT NULL,  -- 'not_started', 'in_progress', 'completed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- User notes
  notes TEXT,

  -- Time tracking
  time_spent INTEGER,  -- User-reported minutes spent (optional)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(plan_id, resource_id)
);

CREATE INDEX idx_progress_plan ON progress_entries(plan_id);
CREATE INDEX idx_progress_resource ON progress_entries(resource_id);
CREATE INDEX idx_progress_status ON progress_entries(status);
CREATE INDEX idx_progress_completed ON progress_entries(completed_at);
```

**Columns**:
- `id`: UUID primary key
- `plan_id`: Reference to learning plan
- `resource_id`: Reference to resource
- `status`: Current status (not_started, in_progress, completed)
- `started_at`: When user started the resource
- `completed_at`: When user marked it complete
- `notes`: User's personal notes on the resource
- `time_spent`: Optional user-reported time
- `created_at`, `updated_at`: Audit timestamps

**Unique Constraint**:
- One progress entry per (plan, resource) pair
- Update existing entry rather than creating duplicates

---

## Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Topic {
  id               String            @id @default(uuid()) @db.Uuid
  name             String            @db.VarChar(255)
  normalizedName   String            @map("normalized_name") @db.VarChar(255)
  slug             String            @unique @db.VarChar(255)
  createdAt        DateTime          @default(now()) @map("created_at") @db.Timestamptz(3)
  lastAggregatedAt DateTime?         @map("last_aggregated_at") @db.Timestamptz(3)
  resourceCount    Int               @default(0) @map("resource_count")
  metadata         Json              @default("{}")

  resources        TopicResource[]
  learningPlans    LearningPlan[]

  @@index([normalizedName])
  @@index([slug])
  @@index([lastAggregatedAt])
  @@map("topics")
}

model Resource {
  id              String            @id @default(uuid()) @db.Uuid
  title           String            @db.VarChar(500)
  description     String?           @db.Text
  url             String            @unique @db.VarChar(2048)
  normalizedUrl   String            @map("normalized_url") @db.VarChar(2048)

  type            String            @db.VarChar(50)
  difficulty      String?           @db.VarChar(50)
  pricing         String?           @db.VarChar(50)
  platform        String?           @db.VarChar(100)

  duration        Int?
  rating          Decimal?          @db.Decimal(3, 2)
  reviewCount     Int?              @map("review_count")
  viewCount       Int?              @map("view_count")

  publishDate     DateTime?         @map("publish_date") @db.Timestamptz(3)
  lastUpdatedDate DateTime?         @map("last_updated_date") @db.Timestamptz(3)
  lastVerifiedAt  DateTime?         @map("last_verified_at") @db.Timestamptz(3)

  qualityScore    Int?              @map("quality_score")
  thumbnailUrl    String?           @map("thumbnail_url") @db.VarChar(2048)

  metadata        Json              @default("{}")

  createdAt       DateTime          @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt       DateTime          @updatedAt @map("updated_at") @db.Timestamptz(3)

  topics          TopicResource[]
  progressEntries ProgressEntry[]

  @@index([url])
  @@index([normalizedUrl])
  @@index([type])
  @@index([difficulty])
  @@index([pricing])
  @@index([platform])
  @@index([qualityScore(sort: Desc)])
  @@index([rating(sort: Desc)])
  @@map("resources")
}

model TopicResource {
  id             String   @id @default(uuid()) @db.Uuid
  topicId        String   @map("topic_id") @db.Uuid
  resourceId     String   @map("resource_id") @db.Uuid
  relevanceScore Decimal? @map("relevance_score") @db.Decimal(5, 2)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  topic          Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)
  resource       Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([topicId, resourceId])
  @@index([topicId])
  @@index([resourceId])
  @@index([relevanceScore(sort: Desc)])
  @@map("topic_resources")
}

model LearningPlan {
  id                   String          @id @default(uuid()) @db.Uuid
  topicId              String          @map("topic_id") @db.Uuid
  title                String          @db.VarChar(255)
  preferences          Json
  phases               Json
  totalDuration        Int?            @map("total_duration")
  completionPercentage Decimal         @default(0) @map("completion_percentage") @db.Decimal(5, 2)
  createdAt            DateTime        @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt            DateTime        @updatedAt @map("updated_at") @db.Timestamptz(3)

  topic                Topic           @relation(fields: [topicId], references: [id], onDelete: Cascade)
  progressEntries      ProgressEntry[]

  @@index([topicId])
  @@index([createdAt(sort: Desc)])
  @@map("learning_plans")
}

model ProgressEntry {
  id          String        @id @default(uuid()) @db.Uuid
  planId      String        @map("plan_id") @db.Uuid
  resourceId  String        @map("resource_id") @db.Uuid
  status      String        @db.VarChar(50)
  startedAt   DateTime?     @map("started_at") @db.Timestamptz(3)
  completedAt DateTime?     @map("completed_at") @db.Timestamptz(3)
  notes       String?       @db.Text
  timeSpent   Int?          @map("time_spent")
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime      @updatedAt @map("updated_at") @db.Timestamptz(3)

  plan        LearningPlan  @relation(fields: [planId], references: [id], onDelete: Cascade)
  resource    Resource      @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([planId, resourceId])
  @@index([planId])
  @@index([resourceId])
  @@index([status])
  @@index([completedAt])
  @@map("progress_entries")
}
```

---

## Sample Queries

### 1. Get all resources for a topic with filters
```typescript
const resources = await prisma.resource.findMany({
  where: {
    topics: {
      some: {
        topic: {
          slug: 'react-hooks'
        }
      }
    },
    pricing: 'free',
    type: { in: ['video', 'tutorial'] },
    difficulty: 'beginner'
  },
  orderBy: [
    { qualityScore: 'desc' },
    { rating: 'desc' }
  ],
  take: 50
});
```

### 2. Get learning plan with progress
```typescript
const plan = await prisma.learningPlan.findUnique({
  where: { id: planId },
  include: {
    topic: true,
    progressEntries: {
      include: {
        resource: true
      }
    }
  }
});
```

### 3. Calculate plan completion percentage
```typescript
const progressStats = await prisma.progressEntry.groupBy({
  by: ['status'],
  where: { planId },
  _count: true
});

const total = progressStats.reduce((sum, s) => sum + s._count, 0);
const completed = progressStats.find(s => s.status === 'completed')?._count || 0;
const percentage = (completed / total) * 100;
```

### 4. Full-text search resources
```sql
-- Raw SQL for full-text search
SELECT * FROM resources
WHERE to_tsvector('english', title || ' ' || COALESCE(description, ''))
      @@ to_tsquery('english', 'react & hooks')
ORDER BY quality_score DESC
LIMIT 20;
```

---

## Data Integrity Constraints

### Cascading Deletes
- Deleting a **Topic** cascades to:
  - `topic_resources` (orphan cleanup)
  - `learning_plans` (plans become invalid)
- Deleting a **Resource** cascades to:
  - `topic_resources` (orphan cleanup)
  - `progress_entries` (progress data becomes invalid)
- Deleting a **LearningPlan** cascades to:
  - `progress_entries` (orphan cleanup)

### Validation Rules (Application Layer)
- **URL Validation**: Must be valid HTTP/HTTPS URL
- **Difficulty**: Enum of 'beginner', 'intermediate', 'advanced', 'unspecified'
- **Type**: Enum of 'video', 'article', 'course', 'book', 'tutorial', 'documentation', 'project'
- **Pricing**: Enum of 'free', 'freemium', 'premium', 'unknown'
- **Rating**: 0.00 to 5.00
- **Quality Score**: 0 to 100
- **Status**: Enum of 'not_started', 'in_progress', 'completed'

---

## Migration Strategy

### Initial Migration (MVP)
1. Create all tables with indexes
2. Seed database with sample topics (React, Node.js, Python, etc.)
3. Optionally seed with curated high-quality resources

### Future Migrations
- Add `users` table when authentication is implemented
- Add `plan_id` foreign key to `progress_entries` for user-specific progress
- Add `shares` table for shareable plan links
- Add `comments` table for resource discussions (Phase 9+)

---

## Performance Optimizations

### Indexes
All critical query paths are indexed:
- Topic lookups by name/slug
- Resource filtering by type, difficulty, pricing, platform
- Resource sorting by quality/rating
- Full-text search on resource title/description
- Progress lookups by plan

### JSONB Queries
PostgreSQL JSONB is highly optimized:
```sql
-- Query plan preferences
SELECT * FROM learning_plans
WHERE preferences->>'freeOnly' = 'true';

-- Query phases
SELECT * FROM learning_plans
WHERE phases @> '[{"name": "useState Fundamentals"}]';
```

### Connection Pooling
Prisma uses connection pooling by default:
```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```

---

## Backup Strategy

### Automated Backups (Production)
- **Frequency**: Daily automated backups (managed by hosting platform)
- **Retention**: 7 days for MVP, 30 days for production
- **Point-in-Time Recovery**: Enable WAL archiving for PostgreSQL

### Manual Backups (Development)
```bash
pg_dump -U postgres learning_aggregator_dev > backup_$(date +%Y%m%d).sql
```

---

## Data Seeding (Development)

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed sample topic
  const reactTopic = await prisma.topic.create({
    data: {
      name: 'React Hooks',
      normalizedName: 'react hooks',
      slug: 'react-hooks',
      metadata: {
        category: 'frontend',
        difficulty: 'intermediate'
      }
    }
  });

  // Seed sample resources
  await prisma.resource.createMany({
    data: [
      {
        title: 'React Hooks Tutorial for Beginners',
        description: 'Learn the basics of React Hooks...',
        url: 'https://www.youtube.com/watch?v=example1',
        normalizedUrl: 'https://youtube.com/watch?v=example1',
        type: 'video',
        difficulty: 'beginner',
        pricing: 'free',
        platform: 'youtube',
        duration: 45,
        rating: 4.8,
        reviewCount: 1200,
        qualityScore: 85
      },
      // ... more resources
    ]
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

**Document Status**: Ready for Implementation
**Last Updated**: 2026-02-07
**Author**: Engineering Team
