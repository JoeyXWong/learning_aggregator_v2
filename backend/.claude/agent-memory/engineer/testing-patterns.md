# Testing Patterns for Backend Services and Routes

## Overview
This document captures successful patterns for testing backend services and routes with comprehensive coverage.

## Test Coverage Achieved
### Service Tests
- **YouTube Service**: 89.28% (31 tests)
- **GitHub Service**: 88.05% (22 tests)
- **Aggregator Service**: 95.87% (16 tests)
- **Plan Generator Service**: 87.96% (25 tests)
- **Total Service Coverage**: ~90% statements

### Route Integration Tests
- **Health Routes**: 4 tests
- **Topics Routes**: 24 tests
- **Resources Routes**: 22 tests
- **Plans Routes**: 22 tests
- **Progress Routes**: 21 tests
- **Total Route Tests**: 89 tests - all passing

## Mocking External Dependencies

### 1. Axios HTTP Calls
```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// In tests:
mockedAxios.get.mockResolvedValue({ data: { items: [...] } });
mockedAxios.get.mockRejectedValue({ isAxiosError: true, response: { status: 403 } });
```

### 2. Prisma Database
```typescript
jest.mock('../../utils/db', () => ({
  prisma: {
    topic: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    resource: {
      upsert: jest.fn(),
    },
    topicResource: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    learningPlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock complete Resource type with all required fields:
const mockResource = {
  id, url, normalizedUrl, title, description, type, difficulty, pricing,
  platform, duration, rating, reviewCount, viewCount, publishDate,
  lastUpdatedDate, lastVerifiedAt, qualityScore,
  thumbnailUrl, metadata, // Don't forget these!
  createdAt, updatedAt
};
```

### 3. Config Module
```typescript
jest.mock('../../config', () => ({
  config: {
    apiKeys: {
      youtube: 'test-youtube-api-key',
      github: 'test-github-token',
      claude: 'test-claude-api-key',
    },
  },
}));
```

### 4. Logger
```typescript
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
```

### 5. Anthropic SDK
```typescript
jest.mock('@anthropic-ai/sdk');
const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

let mockAnthropicInstance: any;
beforeEach(() => {
  mockAnthropicInstance = {
    messages: { create: jest.fn() }
  };
  MockedAnthropic.mockImplementation(() => mockAnthropicInstance);
});

// Mock Claude response:
mockAnthropicInstance.messages.create.mockResolvedValue({
  content: [{ type: 'text', text: JSON.stringify({ phases: [...] }) }]
});
```

## Service-Specific Test Patterns

### YouTube Service Tests
**Key aspects to test:**
- Search flow (search API → videos API)
- Duration parsing (ISO 8601: `PT15M33S`, `PT1H2M10S`)
- Rating calculation from like/dislike ratio
- Thumbnail fallback (high → medium → default)
- Error handling (403 quota, 400 bad request)
- Empty results handling
- Missing API key scenario

**Example duration parsing test:**
```typescript
it('should parse PT1H2M10S to 62 minutes', () => {
  const duration = (service as any).parseDuration('PT1H2M10S');
  expect(duration).toBe(62);
});
```

### GitHub Service Tests
**Key aspects to test:**
- Multi-query search pattern
- Repository deduplication by URL
- Filtering archived repos
- Filtering repos without descriptions
- Authorization header with/without token
- Rate limit handling (403, 401)
- Sort by stars and limit results
- Empty results handling

**Example deduplication test:**
```typescript
it('should deduplicate repositories by URL', async () => {
  // Mock returns same repo in multiple queries
  mockedAxios.get
    .mockResolvedValueOnce({ data: { items: [repo] } })
    .mockResolvedValueOnce({ data: { items: [repo] } });

  const results = await githubService.searchRepositories('React');
  expect(results).toHaveLength(1);
});
```

### Aggregator Service Tests
**Key aspects to test:**
- Parallel fetching from multiple sources
- Cache hit/miss scenarios
- Cache expiration (TTL)
- Quality score filtering
- Resource deduplication (keeps higher quality)
- Service availability checks
- Include/exclude source options
- Database storage with upsert
- Topic metadata updates

**Example cache test:**
```typescript
it('should return cached results when available', async () => {
  await aggregatorService.aggregateResources('React'); // Populate cache
  (aggregatorService as any).setCache('topic:topic-123', cachedResult);

  const result = await aggregatorService.aggregateResources('React');
  expect(youtubeService.searchVideos).toHaveBeenCalledTimes(1); // Not called again
});
```

### Plan Generator Service Tests
**Key aspects to test:**
- Claude API integration
- Fallback plan when Claude unavailable
- JSON parsing with/without markdown fences
- Invalid JSON handling → fallback
- Preference filters (freeOnly, preferredTypes)
- Difficulty-based phase organization
- Phase duration estimation
- Plan retrieval with completion percentage sync
- Markdown export format
- PDF export returns Buffer
- Error cases (topic not found, no resources, no matches)

**Example fallback test:**
```typescript
it('should generate fallback plan when Claude unavailable', async () => {
  const service = new PlanGeneratorService();
  (service as any).anthropic = null;

  const plan = await service.generatePlan('topic-123');
  expect(plan.phases.length).toBeGreaterThan(0);
  expect(mockAnthropicInstance.messages.create).not.toHaveBeenCalled();
});
```

## Common Test Structure

### Setup Pattern
```typescript
describe('ServiceName', () => {
  let service: ServiceClass;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServiceClass();
  });

  describe('methodName', () => {
    it('should handle happy path', async () => {
      // Arrange: Mock dependencies
      // Act: Call method
      // Assert: Check results
    });

    it('should handle error case', async () => {
      // Arrange: Mock error
      // Act & Assert: Expect error
    });
  });
});
```

### Testing Private Methods
```typescript
// Access private method for unit testing
const result = (service as any).privateMethodName(args);
```

### Testing Error Handling
```typescript
// Axios errors with response
mockedAxios.get.mockRejectedValue({
  isAxiosError: true,
  response: { status: 403 },
  message: 'Rate limit exceeded'
});

// Generic errors
mockedAxios.get.mockRejectedValue(new Error('Network error'));

// Expect error thrown
await expect(service.method()).rejects.toThrow('Expected message');

// Expect graceful handling (returns empty array)
const result = await service.method();
expect(result).toHaveLength(0);
```

## Best Practices

1. **Mock at module level** - Mock dependencies before importing the service
2. **Clear mocks in beforeEach** - Prevents test pollution
3. **Test one behavior per test** - Clear, focused test cases
4. **Use descriptive test names** - "should X when Y"
5. **Test error paths** - API errors, missing data, invalid responses
6. **Test edge cases** - Empty results, null values, missing fields
7. **Mock parallel calls** - Use `mockResolvedValueOnce` for sequential mocks
8. **Access private methods** - Use `(service as any).method()` for unit testing
9. **Complete type mocking** - Include all required fields (thumbnailUrl, metadata)
10. **Test async operations** - Use async/await, not callbacks

## Coverage Tips

- Test all public methods
- Test private methods that contain significant logic
- Test error branches (try/catch, if/else)
- Test loops and array operations (map, filter, reduce)
- Test conditional logic
- Don't test simple getters/setters
- Don't test third-party library internals

## Route Integration Testing Pattern

Route tests follow a consistent structure to test API endpoints with mocked dependencies.

### Test File Structure

```typescript
import request from 'supertest';
import express, { Application } from 'express';
import routeModule from '../route-name';
import { serviceName } from '../../services/service-name.service';
import { prisma } from '../../utils/db';
import { errorHandler } from '../../middleware/errorHandler';

// Mock dependencies at module level
jest.mock('../../services/service-name.service');
jest.mock('../../utils/db', () => ({
  prisma: {
    model: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Route Name', () => {
  let app: Application;

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/route', routeModule);
    app.use(errorHandler);

    // Clear all mocks
    jest.clearAllMocks();
  });

  // Test suites...
});
```

### Test Coverage Categories

For each endpoint, test:

1. **Happy Path (200/201)**: Valid input → expected response
2. **Input Validation (400)**: Invalid/missing fields → error
3. **Not Found (404)**: Non-existent resources → error
4. **Error Propagation (500)**: Service/database errors → error

### Route Testing Patterns

**Testing GET with query parameters:**
```typescript
const response = await request(app).get('/api/route?param=value');
expect(response.status).toBe(200);
```

**Testing POST with body:**
```typescript
const response = await request(app)
  .post('/api/route')
  .send({ field: 'value' });
expect(response.status).toBe(201);
```

**Testing file downloads:**
```typescript
expect(response.headers['content-type']).toBe('text/markdown; charset=utf-8');
expect(response.headers['content-disposition']).toBe('attachment; filename="file.md"');
```

**Testing pagination:**
```typescript
expect(response.body.data.pagination).toEqual({
  total: 50,
  limit: 10,
  offset: 20,
  hasMore: true,
});
```

### Validation Testing

Test all Zod schema constraints:
```typescript
// String length
it('should reject name that is too short', async () => {
  const response = await request(app).post('/api/route').send({ name: 'a' });
  expect(response.status).toBe(400);
});

// Number range
it('should reject invalid score', async () => {
  const response = await request(app).get('/api/route?score=150');
  expect(response.status).toBe(400);
});

// Enum values
it('should reject invalid status', async () => {
  const response = await request(app).post('/api/route').send({ status: 'invalid' });
  expect(response.status).toBe(400);
});
```

### Route-Specific Tests

**health.test.ts**: Database connectivity, health status
**topics.test.ts**: Topic CRUD, resource aggregation, filtering, caching
**resources.test.ts**: Search, filtering, pagination, statistics
**plans.test.ts**: Plan generation, CRUD, export (markdown/PDF)
**progress.test.ts**: Progress tracking, updates, statistics

### Best Practices for Route Tests

1. **Fresh app per test**: Create new Express app in `beforeEach`
2. **Mock at module level**: Mock services and prisma before imports
3. **Clear mocks**: Always call `jest.clearAllMocks()` in `beforeEach`
4. **Include error handler**: Add `errorHandler` middleware to test app
5. **Test all validations**: Cover every Zod schema rule
6. **Service isolation**: Route tests don't test service logic
7. **Consistent responses**: All routes return `{ success, message?, data? }`

## Running Tests

```bash
# All tests
npm test

# Service tests only
npm test -- src/services/__tests__/

# Route tests only
npm test -- src/routes/__tests__/

# Specific test file
npm test -- youtube.service.test.ts

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# No coverage (faster)
npm test -- --no-coverage
```

## Common Pitfalls

1. **Forgetting to mock config** - Services read API keys from config
2. **Missing Prisma fields** - Resource needs thumbnailUrl and metadata
3. **Not clearing mocks** - Tests can affect each other
4. **Testing implementation details** - Focus on behavior, not internals
5. **Hardcoded dates** - Use `new Date()` or mock Date.now()
6. **Type const for string literals** - Use `'moderate' as const` for pace types
7. **Unused imports** - Remove unused type imports to avoid TS errors
