# Learning Aggregator V2 Backend - Code Reviewer Memory

## Key Patterns
- Express routes use inline try/catch with `error: any` typing
- Zod schemas for request validation at route level
- Services are singleton classes exported at module level
- Prisma client shared via `utils/db.ts`
- Winston logger via `utils/logger.ts`
- Config via dotenv in `config/index.ts` with no runtime validation

## Known Issues
- `asyncHandler` middleware exists but only used in health route -- all other routes duplicate try/catch
- AggregatorService has unbounded in-memory Map cache
- PlanGeneratorService stores phases/preferences as JSON strings in DB (no structured columns)
- storeResources does sequential upserts instead of batch operations
- error.message exposed in all 500 responses regardless of NODE_ENV
- Claude API response parsed with JSON.parse with no structural validation
- `getOrCreateTopic` return type is `Promise<any>` instead of Prisma type
- `getTopicResources` filters in application layer instead of database WHERE clauses
