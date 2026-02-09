# Learning Aggregator V2

[![CI](https://github.com/JoeyXWong/learning_aggregator_v2/actions/workflows/ci.yml/badge.svg)](https://github.com/JoeyXWong/learning_aggregator_v2/actions/workflows/ci.yml)

A web application that helps users create personalized learning plans for any topic by aggregating and curating the best learning resources from across the internet.

## Overview

Learning Aggregator V2 discovers resources from multiple platforms, classifies them by type and difficulty, generates structured learning paths, and tracks user progress through their learning journey.

**Status**: Phase 1 - Foundation Complete

---

## Features (Planned)

### Phase 1: Foundation (Complete)
- Project setup and architecture
- Database schema and migrations
- Basic API structure
- Frontend scaffold

### Phase 2-5: MVP Features (In Progress)
- Topic search and resource discovery
- Resource filtering (free/premium, type, difficulty)
- AI-powered learning plan generation
- Progress tracking
- Export to Markdown/PDF

See [MILESTONES.md](MILESTONES.md) for the complete roadmap.

---

## Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with Prisma ORM
- **AI/LLM**: Anthropic Claude API
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Deployment**: Railway/Render (planned)
- **CI/CD**: GitHub Actions
  - Automated testing on every push and PR
  - Parallel backend and frontend test jobs
  - Enforced coverage thresholds
  - Linting and type checking

---

## Project Structure

```
learning_aggregator_v2/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Helper functions
│   └── prisma/          # Database schema
│
├── frontend/            # React + Vite
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       ├── services/    # API client
│       └── utils/       # Helper functions
│
└── docs/                # Documentation
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 10+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learning_aggregator_v2
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run prisma:migrate
   npm run dev
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

See [SETUP.md](SETUP.md) for detailed setup instructions.

---

## Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup and development guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design decisions
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Database schema and data model
- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Product requirements and user stories
- **[MILESTONES.md](MILESTONES.md)** - Development roadmap and phases

---

## Development

### Backend Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm test                 # Run tests
npm run lint             # Lint code
npm run prisma:studio    # Open database GUI
```

### Frontend Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm test                 # Run tests
npm run lint             # Lint code
```

---

## API Endpoints

### Health Check
```
GET /api/health          # API health status
GET /api/health/db       # Database connection status
```

### Topics & Resources (Coming in Phase 2)
```
POST   /api/topics              # Submit topic for aggregation
GET    /api/topics/:id/resources # Get resources for a topic
```

### Learning Plans (Coming in Phase 3)
```
POST   /api/plans/generate      # Generate learning plan
GET    /api/plans/:id           # Get plan details
GET    /api/plans/:id/export    # Export plan
```

### Progress Tracking (Coming in Phase 4)
```
POST   /api/progress            # Update progress
GET    /api/progress/:planId    # Get plan progress
```

---

## Architecture Highlights

### Resource Discovery
- Parallel API calls to multiple platforms (YouTube, GitHub, etc.)
- Web scraping for platforms without APIs
- Automatic deduplication
- Quality scoring algorithm

### Learning Plan Generation
- AI-powered subtopic breakdown using Claude
- Difficulty progression sequencing
- Customizable preferences (free-only, pace, resource types)
- Time estimation based on learning pace

### Data Model
- **Topics**: Learning subjects submitted by users
- **Resources**: Aggregated learning materials with metadata
- **Learning Plans**: Structured sequences of resources
- **Progress Tracking**: User completion status and notes

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete details.

---

## Testing

### Running Tests Locally

**Backend Tests**
```bash
cd backend
npm test                 # Run all tests with coverage
npm run test:watch       # Watch mode for development
```

**Frontend Tests**
```bash
cd frontend
npm test                 # Run all tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Coverage Requirements

The project enforces minimum code coverage thresholds in CI:

| Area     | Branches | Functions | Lines | Statements |
|----------|----------|-----------|-------|------------|
| Backend  | 90%      | 90%       | 90%   | 90%        |
| Frontend | 20%      | 20%       | 20%   | 20%        |

**Current Coverage:**
- **Backend**: 202 tests, ~91% coverage ✅
- **Frontend**: 24 tests, ~22% coverage ✅

To view detailed coverage reports after running tests:
- **Backend**: Open `backend/coverage/lcov-report/index.html`
- **Frontend**: Open `frontend/coverage/index.html`

### Pre-Commit Checklist

Before submitting a PR, ensure:
```bash
# Backend
cd backend
npm run lint              # Check linting
npm test                  # Run tests with coverage
npm run build             # Verify TypeScript compilation

# Frontend
cd frontend
npm run lint              # Check linting
npx tsc --noEmit         # Type check without emitting files
npm run test:coverage    # Run tests with coverage
npm run build            # Verify production build
```

---

## Contributing

This is currently a learning project. Contributions are welcome once the MVP is complete.

### Development Process
1. Review REQUIREMENTS.md for feature specifications
2. Check MILESTONES.md for current phase
3. Follow the architecture patterns in ARCHITECTURE.md
4. Write tests for new features
5. Ensure code passes linting

---

## Roadmap

- **Phase 1** (Complete): Foundation & database setup
- **Phase 2** (Next): Resource discovery and aggregation
- **Phase 3**: Learning plan generation with AI
- **Phase 4**: Backend API development
- **Phase 5**: Frontend UI implementation
- **Phase 6**: AI/LLM integration and recommendations
- **Phase 7**: Testing and quality assurance
- **Phase 8**: Polish and deployment
- **Phase 9**: Post-launch enhancements

See [MILESTONES.md](MILESTONES.md) for detailed breakdown.

---

## License

MIT

---

## Acknowledgments

Built with:
- [Node.js](https://nodejs.org/)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

**Version**: 0.1.0
**Last Updated**: 2026-02-07
