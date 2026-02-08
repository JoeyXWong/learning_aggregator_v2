# Phase 2 Quick Start Guide

## Prerequisites
- Node.js 20+ installed
- npm 10+ installed
- API keys (optional but recommended):
  - YouTube Data API v3 key
  - GitHub Personal Access Token

## Setup (5 minutes)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure API Keys

Edit `/Users/joeywong/Documents/GitHub/learning_aggregator_v2/backend/.env`:

```env
# Required for YouTube resources
YOUTUBE_API_KEY="your-youtube-api-key"

# Optional - increases GitHub rate limits
GITHUB_TOKEN="your-github-token"
```

**Get YouTube API Key:**
1. Visit https://console.cloud.google.com/
2. Create/select project
3. Enable "YouTube Data API v3"
4. Create API Key
5. Paste above

**Get GitHub Token (Optional):**
1. Visit https://github.com/settings/tokens
2. Generate token → Select `public_repo` scope
3. Paste above

### 3. Initialize Database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Start Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:3000

# Terminal 2 - Frontend
cd frontend
npm run dev
# App runs on http://localhost:5173
```

## Using Phase 2 (2 minutes)

### Via Web UI

1. Open http://localhost:5173
2. Enter a topic: "React Hooks", "Docker", "Machine Learning"
3. Click "Find Resources" (wait 10-30 seconds)
4. Browse resources with filters:
   - **Type**: video, repository, course, etc.
   - **Difficulty**: beginner, intermediate, advanced
   - **Pricing**: free, freemium, premium

### Via API

```bash
# Create topic and aggregate resources
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name": "Docker"}'

# Response includes topicId
# {
#   "success": true,
#   "data": {
#     "topicId": "cm5xyz123...",
#     "resourceCount": 45,
#     "sources": { "youtube": 20, "github": 25 },
#     "averageQualityScore": 68.5
#   }
# }

# Get resources with filters
curl "http://localhost:3000/api/topics/{topicId}/resources?type=video&pricing=free"

# Search all resources
curl "http://localhost:3000/api/resources/search?query=docker&minQualityScore=60"
```

## Testing

```bash
cd backend
npm test

# Should see:
# Test Suites: 1 passed
# Tests: 17 passed
```

## Common Issues

### "YouTube API key not configured"
- Add `YOUTUBE_API_KEY` to `/Users/joeywong/Documents/GitHub/learning_aggregator_v2/backend/.env`
- Restart backend server

### "API Status: disconnected"
- Ensure backend is running on port 3000
- Check backend terminal for errors
- Verify DATABASE_URL in `.env`

### No resources found
- Check API keys are valid
- Try a more common topic first (e.g., "React")
- Check backend logs for API errors

### GitHub rate limit
- Add `GITHUB_TOKEN` to `.env` (increases from 60 to 5000 req/hour)
- Or wait 1 hour for rate limit reset

## What's Working

✅ YouTube video discovery
✅ GitHub repository discovery
✅ Smart classification (type, difficulty, pricing)
✅ Quality scoring (0-100)
✅ Resource deduplication
✅ Filtering and search
✅ Responsive UI
✅ Caching (7-day TTL)

## What's Next

Phase 3 will add:
- AI-powered learning plan generation
- Subtopic breakdown
- Resource sequencing (beginner → advanced)
- Timeline visualization
- PDF/Markdown export

## Need Help?

Check the detailed documentation:
- `PHASE2_COMPLETE.md` - Full implementation details
- `REQUIREMENTS.md` - Product requirements
- `ARCHITECTURE.md` - Technical architecture
- `MEMORY.md` - Engineer learnings

---

**Phase 2 Status**: ✅ COMPLETE
**Estimated Setup Time**: 5 minutes
**Estimated Learning Time**: 2 minutes
