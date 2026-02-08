# Backend Engineering Memory

## Project Structure

- **Services** (`src/services/`): Business logic and data operations
- **Routes** (`src/routes/`): API endpoint definitions with validation
- **Middleware** (`src/middleware/`): Error handling and request processing
- **Utils** (`src/utils/`): Database client, logger, and shared utilities

## Code Patterns

### Error Handling
- Always use `asyncHandler` wrapper for route handlers - never manual try/catch
- Throw `AppError(statusCode, message)` for expected errors
- The error middleware automatically handles AppError and unexpected errors
- Return consistent JSON: `{ success: boolean, message?: string, data?: any }`

### Validation
- Use Zod for all input validation
- Call `.safeParse()` and throw `AppError(400, 'Invalid request data')` on failure
- Define schemas at the top of route files

### Service Layer
- Export service as singleton: `export const serviceName = new ServiceClass()`
- Use logger for info/error tracking
- Throw standard Error objects (converted to 500 by error handler)
- Return typed data structures

### Database Access
- Import prisma from `../utils/db`
- Use Prisma's type-safe query methods
- Always verify related entities exist before operations
- Use transactions for multi-step operations

### Testing
- Mock external dependencies (prisma, logger, services)
- Use Jest with ts-jest
- Place service tests in `src/services/__tests__/`
- Place route tests in `src/routes/__tests__/`
- Route tests need `@types/supertest` installed
- See detailed testing patterns in [testing-patterns.md](testing-patterns.md)

## Progress Tracking Implementation

### Key Features
- Automatic timestamp management (startedAt, completedAt) based on status transitions
- Plan completion percentage auto-updates when progress changes
- Status values: 'not_started', 'in_progress', 'completed'
- Unique constraint on (planId, resourceId) - use upsert for updates

### Timestamp Logic
- startedAt: Set when first moving from 'not_started' to 'in_progress' or 'completed'
- completedAt: Set when status becomes 'completed', cleared if moved back
- Never overwrite existing timestamps unless transitioning states

### Route Order Matters
- `/stats` must be defined before `/:planId` to avoid routing conflicts
- More specific routes before parameterized routes

## Testing Notes
- Express serializes Dates to ISO strings in JSON responses
- Don't use `.toEqual()` for responses with dates - check specific fields instead
- Coverage warnings are expected when running isolated test suites
