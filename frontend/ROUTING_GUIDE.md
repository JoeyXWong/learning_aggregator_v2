# React Router Navigation Guide

## Route Structure

```
┌─────────────────────────────────────────────────────────────┐
│                         App Layout                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Header (with API status + clickable logo)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Routes                            │   │
│  │                                                     │   │
│  │  / ──────────────► HomePage                        │   │
│  │  │                 └─ TopicSearch                  │   │
│  │  │                 └─ Recent Topics                │   │
│  │  │                 └─ Recent Plans                 │   │
│  │  │                                                  │   │
│  │  └─► /topics/:topicId/resources                    │   │
│  │      │                └─ ResourcesPage             │   │
│  │      │                   └─ ResourceList           │   │
│  │      │                                              │   │
│  │      └─► /topics/:topicId/plan                     │   │
│  │          │         └─ PlanGeneratorPage            │   │
│  │          │            └─ PlanGenerator             │   │
│  │          │                                          │   │
│  │          └─► /plans/:planId                        │   │
│  │                      └─ PlanViewerPage             │   │
│  │                         └─ PlanViewer              │   │
│  │                                                     │   │
│  │  * (404) ────────► NotFoundPage                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Footer                                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Navigation Flow

### User Journey 1: Search Topic → View Resources → Generate Plan

```
1. User lands on HomePage (/)
   └─> Enters topic name in TopicSearch
       └─> API creates topic and returns topicId
           └─> navigate(`/topics/${topicId}/resources`)

2. User arrives at ResourcesPage (/topics/:topicId/resources)
   └─> Page uses useParams() to get topicId
       └─> Fetches topic data and displays ResourceList
           └─> User clicks "Generate Learning Plan"
               └─> navigate(`/topics/${topicId}/plan`)

3. User arrives at PlanGeneratorPage (/topics/:topicId/plan)
   └─> Page uses useParams() to get topicId
       └─> User sets preferences and submits
           └─> API generates plan and returns planId
               └─> navigate(`/plans/${planId}`)

4. User arrives at PlanViewerPage (/plans/:planId)
   └─> Page uses useParams() to get planId
       └─> Displays complete learning plan with phases
```

### User Journey 2: Direct Access via URL

```
User pastes URL: /topics/123/resources
   └─> React Router matches route
       └─> Renders ResourcesPage
           └─> useParams() extracts topicId = "123"
               └─> Fetches topic data from API
                   └─> Displays resources
```

### User Journey 3: Using Recent Activity

```
1. User on HomePage (/)
   └─> Sees "Recent Topics" section
       └─> Clicks on a topic
           └─> navigate(`/topics/${topic.id}/resources`)

2. User on HomePage (/)
   └─> Sees "Recent Learning Plans" section
       └─> Clicks on a plan
           └─> navigate(`/plans/${plan.id}`)
```

## Code Examples

### Navigate to Resources Page
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
const topicId = "abc123";

// Programmatic navigation
navigate(`/topics/${topicId}/resources`);
```

### Link to Resources Page
```typescript
import { Link } from 'react-router-dom';

<Link to={`/topics/${topicId}/resources`}>
  View Resources
</Link>
```

### Extract URL Parameters
```typescript
import { useParams } from 'react-router-dom';

function ResourcesPage() {
  const { topicId } = useParams<{ topicId: string }>();

  // topicId is now available to use
  const { data } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => topicsApi.getTopic(topicId!),
  });
}
```

### Navigate Back
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Go back one page in history
navigate(-1);

// Or navigate to specific route
navigate('/');
```

## URL Parameters

| Route | Parameters | Example |
|-------|------------|---------|
| `/` | None | `/` |
| `/topics/:topicId/resources` | `topicId` | `/topics/abc123/resources` |
| `/topics/:topicId/plan` | `topicId` | `/topics/abc123/plan` |
| `/plans/:planId` | `planId` | `/plans/xyz789` |

## Page Responsibilities

### HomePage
- **URL**: `/`
- **Fetches**: Recent topics, recent plans
- **Actions**: Navigate to topic resources or plan viewer
- **Components**: TopicSearch, Recent activity lists

### ResourcesPage
- **URL**: `/topics/:topicId/resources`
- **Fetches**: Topic details via `topicId` param
- **Actions**: Navigate to plan generator or home
- **Components**: ResourceList (which fetches and displays resources)

### PlanGeneratorPage
- **URL**: `/topics/:topicId/plan`
- **Fetches**: Topic details via `topicId` param
- **Actions**: Navigate to plan viewer on success, back to resources
- **Components**: PlanGenerator (handles form and generation)

### PlanViewerPage
- **URL**: `/plans/:planId`
- **Fetches**: None (PlanViewer component fetches)
- **Actions**: Navigate back to home
- **Components**: PlanViewer (fetches plan and displays)

### NotFoundPage
- **URL**: Any unmatched route
- **Fetches**: None
- **Actions**: Navigate to home
- **Components**: Error message and link

## Browser Behavior

### Back Button
- Works correctly with React Router
- Returns to previous page in history
- Example: Resources → Plan Generator → (back) → Resources

### Forward Button
- Works correctly after using back
- Example: Resources → (back) → Home → (forward) → Resources

### Refresh (F5)
- Page reloads at current URL
- React Router matches route and renders appropriate page
- Data is re-fetched via React Query
- **Production**: Server must serve `index.html` for all routes

### Bookmarks
- Users can bookmark any page
- Direct URL access works
- Example: Bookmark `/plans/xyz789` to return to a specific plan

## Testing Checklist

- [ ] Can navigate from Home to Resources
- [ ] Can navigate from Resources to Plan Generator
- [ ] Can navigate from Plan Generator to Plan Viewer
- [ ] Back button returns to previous page
- [ ] Clicking logo returns to Home
- [ ] Can access any page via direct URL
- [ ] Page refresh maintains current route
- [ ] Invalid routes show 404 page
- [ ] Recent topics/plans navigate correctly
- [ ] URL parameters are correctly extracted
