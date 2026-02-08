# Setup Guide - Learning Aggregator V2

This guide will help you set up the development environment and run the project locally.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v10.0.0 or higher (comes with Node.js)
- **PostgreSQL**: v15 or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For version control

Verify installations:
```bash
node --version  # Should be v20.0.0 or higher
npm --version   # Should be v10.0.0 or higher
psql --version  # Should be v15 or higher
```

---

## Project Structure

```
learning_aggregator_v2/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Helper functions
│   ├── prisma/          # Database schema and migrations
│   └── tests/           # Backend tests
│
├── frontend/            # React + TypeScript + Vite
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── hooks/       # Custom hooks
│       ├── services/    # API client
│       ├── types/       # TypeScript types
│       └── utils/       # Helper functions
│
└── docs/                # Additional documentation
```

---

## Initial Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd learning_aggregator_v2
```

### 2. Set Up PostgreSQL Database

**Create the database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE learning_aggregator_dev;

# Exit psql
\q
```

---

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/learning_aggregator_dev?schema=public"
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# API Keys (optional for basic setup, required for full functionality)
CLAUDE_API_KEY="sk-ant-your-key-here"
YOUTUBE_API_KEY="your-youtube-api-key-here"
GITHUB_TOKEN="your-github-token-here"
```

**Important**: Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 3. Initialize Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed
```

### 4. Start Backend Server
```bash
npm run dev
```

The backend will start on **http://localhost:3000**

**Verify it's working:**
```bash
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-07T...",
  "uptime": 1.234,
  "environment": "development"
}
```

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd ../frontend
npm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env
```

The default configuration should work:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Frontend Development Server
```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

Open your browser and navigate to **http://localhost:5173**

You should see:
- The Learning Aggregator V2 homepage
- API Status indicator showing "connected" (green)
- Health check response data

---

## Running Both Servers Simultaneously

For convenience, you can run both backend and frontend in separate terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## Development Workflow

### Backend Development

**Run tests:**
```bash
cd backend
npm test
```

**Lint code:**
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

**Format code:**
```bash
npm run format
```

**View database in Prisma Studio:**
```bash
npm run prisma:studio
```
Opens at **http://localhost:5555**

**Create new migration:**
```bash
npm run prisma:migrate
```

### Frontend Development

**Run tests:**
```bash
cd frontend
npm test
```

**Build for production:**
```bash
npm run build
npm run preview  # Preview production build
```

**Lint and format:**
```bash
npm run lint
npm run format
```

---

## Database Management

### View Database
```bash
cd backend
npm run prisma:studio
```

### Reset Database (Warning: Deletes all data)
```bash
npm run db:reset
```

### Create Migration
After modifying `prisma/schema.prisma`:
```bash
npm run prisma:migrate
```

### Manual SQL Access
```bash
psql -U postgres -d learning_aggregator_dev
```

---

## Troubleshooting

### Port Already in Use

**Backend (Port 3000):**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Frontend (Port 5173):**
```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Database Connection Failed

1. Ensure PostgreSQL is running:
   ```bash
   # Check status
   pg_isready

   # Start PostgreSQL (macOS with Homebrew)
   brew services start postgresql@15
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l | grep learning_aggregator
   ```

3. Check DATABASE_URL in backend/.env

### Prisma Generate Errors

```bash
cd backend
rm -rf node_modules
npm install
npm run prisma:generate
```

### Frontend Not Connecting to Backend

1. Ensure backend is running on port 3000
2. Check VITE_API_URL in frontend/.env
3. Check browser console for CORS errors
4. Verify backend CORS configuration allows frontend URL

---

## API Documentation

Once the backend is running, you can test the API:

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Database Health
```bash
curl http://localhost:3000/api/health/db
```

---

## Next Steps

Now that your development environment is set up:

1. Review **ARCHITECTURE.md** to understand the system design
2. Review **DATABASE_SCHEMA.md** to understand the data model
3. Check **REQUIREMENTS.md** for feature specifications
4. Review **MILESTONES.md** for development phases

**Ready to implement Phase 2**: Resource Discovery and Aggregation

---

## Getting API Keys (Optional for MVP)

### Claude API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Add to backend/.env as CLAUDE_API_KEY

### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to backend/.env as YOUTUBE_API_KEY

### GitHub Personal Access Token
1. Go to [GitHub Settings > Developer Settings](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Select scopes: `public_repo`, `read:org`
4. Add to backend/.env as GITHUB_TOKEN

---

## Common Commands Reference

### Backend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Run production build
npm test                 # Run tests
npm run lint             # Check code style
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database GUI
```

### Frontend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run tests
npm run lint             # Check code style
```

---

## Support

If you encounter issues:

1. Check this SETUP.md for troubleshooting steps
2. Review error messages carefully
3. Check that all prerequisites are installed correctly
4. Ensure environment variables are set correctly

---

**Last Updated**: 2026-02-07
**Version**: 0.1.0
