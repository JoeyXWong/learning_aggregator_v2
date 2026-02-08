# Progress Tracking API

## Overview
The Progress Tracking API enables users to track their learning progress across resources in their learning plans.

## Endpoints

### 1. Create/Update Progress Entry
**POST** `/api/progress`

Creates or updates a progress entry for a specific resource in a learning plan.

**Request Body:**
```json
{
  "planId": "string (required)",
  "resourceId": "string (required)",
  "status": "not_started | in_progress | completed (required)",
  "notes": "string (optional, max 2000 chars)",
  "timeSpent": "number (optional, minutes, non-negative integer)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress updated successfully",
  "data": {
    "id": "progress-id",
    "planId": "plan-id",
    "resourceId": "resource-id",
    "status": "in_progress",
    "startedAt": "2024-01-01T12:00:00.000Z",
    "completedAt": null,
    "notes": "Currently working on this",
    "timeSpent": 30,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z",
    "resource": {
      "id": "resource-id",
      "title": "Resource Title",
      "url": "https://example.com",
      "type": "article",
      "difficulty": "beginner",
      "duration": 60
    }
  }
}
```

### 2. Get Progress for a Plan
**GET** `/api/progress/:planId`

Retrieves all progress entries for a specific learning plan.

**Response:**
```json
{
  "success": true,
  "data": {
    "planId": "plan-id",
    "progressEntries": [
      {
        "id": "progress-1",
        "status": "completed",
        "startedAt": "2024-01-01T10:00:00.000Z",
        "completedAt": "2024-01-01T12:00:00.000Z",
        "notes": "Finished",
        "timeSpent": 120,
        "resource": {
          "id": "resource-1",
          "title": "Introduction to Topic",
          "url": "https://example.com/intro",
          "type": "video",
          "difficulty": "beginner",
          "duration": 30
        }
      }
    ],
    "summary": {
      "totalResources": 10,
      "completedCount": 3,
      "inProgressCount": 2,
      "notStartedCount": 5,
      "totalTimeSpent": 450,
      "completionPercentage": 30
    }
  }
}
```

### 3. Update Specific Progress Entry
**PATCH** `/api/progress/:planId/:resourceId`

Updates specific fields of an existing progress entry.

**Request Body:**
```json
{
  "status": "completed (optional)",
  "notes": "Updated notes (optional)",
  "timeSpent": 60 (optional)
}
```

**Note:** At least one field must be provided.

**Response:**
```json
{
  "success": true,
  "message": "Progress entry updated successfully",
  "data": {
    // Same structure as POST /api/progress
  }
}
```

### 4. Get Progress Statistics
**GET** `/api/progress/stats`

Retrieves overall learning statistics across all plans.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPlans": 5,
    "totalResources": 50,
    "completedResources": 20,
    "inProgressResources": 15,
    "notStartedResources": 15,
    "totalTimeSpent": 1200,
    "averageCompletionRate": 42.5,
    "recentActivity": [
      {
        "id": "progress-id",
        "planId": "plan-id",
        "resourceTitle": "Advanced Topic",
        "status": "completed",
        "updatedAt": "2024-01-02T15:30:00.000Z"
      }
    ]
  }
}
```

## Status Values

- `not_started`: Resource has not been started
- `in_progress`: Resource is currently being worked on
- `completed`: Resource has been finished

## Automatic Behaviors

### Timestamp Management
- **startedAt**: Automatically set when status changes from `not_started` to `in_progress` or `completed`
- **completedAt**: Automatically set when status changes to `completed`
- Timestamps are preserved unless status transitions warrant updates

### Plan Completion Tracking
- When progress is updated, the associated learning plan's `completionPercentage` is automatically recalculated
- Calculation: (completed resources / total resources in plan) * 100

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400`: Invalid request data (validation error)
- `404`: Resource or plan not found
- `500`: Server error

## Validation Rules

- **planId**: Non-empty string, must exist in database
- **resourceId**: Non-empty string, must exist in database
- **status**: Must be one of: `not_started`, `in_progress`, `completed`
- **notes**: Maximum 2000 characters
- **timeSpent**: Non-negative integer (minutes)

## Example Usage

### Starting a Resource
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-123",
    "resourceId": "resource-456",
    "status": "in_progress"
  }'
```

### Completing a Resource with Time Tracking
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-123",
    "resourceId": "resource-456",
    "status": "completed",
    "notes": "Great resource, learned a lot!",
    "timeSpent": 120
  }'
```

### Getting Plan Progress
```bash
curl http://localhost:3000/api/progress/plan-123
```

### Getting Overall Statistics
```bash
curl http://localhost:3000/api/progress/stats
```
