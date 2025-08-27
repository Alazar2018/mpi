# Learn Service Documentation

This document describes the Learn Service implementation for managing player modules, weeks, and content items.

## Overview

The Learn Service provides a comprehensive API for managing learning content including:
- Module management and progress tracking
- Week-based content organization
- Video completion tracking
- Assessment completion tracking
- Progress calculations and statistics

## API Endpoints

### 📖 View Player Modules
```http
GET /api/v1/modules/me
```
**Description**: Get all published modules with progress tracking for the authenticated player  
**Access**: Players only  
**Response**: List of modules with progress

### 📋 View Specific Module
```http
GET /api/v1/modules/me/:id
```
**Description**: Get detailed information about a specific module  
**Access**: Players only  
**Parameters**: `id` - Module identifier

### 🎥 Complete Video
```http
PATCH /api/v1/modules/complete-video/:videoId
```
**Description**: Mark a video as completed for the authenticated player  
**Access**: Players only  
**Parameters**: 
- `videoId` - Content Item ID of the video
**Body** (Optional):
```json
{
  "watchTime": 300,
  "completedAt": "2025-08-13T10:30:00.000Z"
}
```

### 📝 Pass Assessment
```http
PATCH /api/v1/modules/assessment/:assessmentId
```
**Description**: Mark an assessment as passed for the authenticated player  
**Access**: Players only  
**Parameters**:
- `assessmentId` - Content Item ID of the assessment
**Body**:
```json
{
  "score": 85,
  "answers": [
    {
      "questionId": "question_id",
      "answer": "selected_option"
    }
  ],
  "timeSpent": 1200,
  "completedAt": "2025-08-13T10:30:00.000Z"
}
```

## Types and Interfaces

### Module
```typescript
interface Module {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  learningObjectives: string[];
  order: number;
  isPublished: boolean;
  progress: ModuleProgress;
  weeks: Week[];
}
```

### Week
```typescript
interface Week {
  _id: string;
  title: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
    isCompleted: boolean;
  };
  contentItems: ContentItem[];
}
```

### ContentItem
```typescript
interface ContentItem {
  _id: string;
  title: string;
  type: 'video' | 'assessment' | 'document' | 'quiz';
  duration?: number; // in seconds, for videos
  progress: {
    status: 'not_started' | 'in_progress' | 'completed';
    completedAt?: string;
  };
}
```

### ModuleProgress
```typescript
interface ModuleProgress {
  completedWeeks: number;
  totalWeeks: number;
  completedContent: number;
  totalContent: number;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
}
```

## Usage Examples

### Basic Module Fetching
```typescript
import { learnService } from '@/service/learn.server';

// Get all player modules
try {
  const modules = await learnService.getPlayerModules();
  console.log('Player modules:', modules);
} catch (error) {
  console.error('Failed to fetch modules:', error);
}
```

### Video Completion Tracking
```typescript
import { learnService } from '@/service/learn.server';

// Complete a video
await learnService.completeVideo(videoId, {
  watchTime: 180, // 3 minutes
  completedAt: new Date().toISOString()
});
```

### Assessment Completion Tracking
```typescript
import { learnService } from '@/service/learn.server';

// Pass an assessment
const assessmentData = {
  score: 85,
  answers: [
    { questionId: 'q1', answer: 'A' },
    { questionId: 'q2', answer: 'B' }
  ],
  timeSpent: 300, // 5 minutes
  completedAt: new Date().toISOString()
};
await learnService.passAssessment(assessmentId, assessmentData);
```

## Custom Hook: useLearn

The `useLearn` hook provides a convenient way to manage learn state in React components:

```typescript
import { useLearn } from '@/hooks/useLearn';

function MyComponent() {
  const {
    modules,
    loading,
    error,
    overallProgress,
    completeVideo,
    passAssessment
  } = useLearn();

  // Use the hook's state and functions
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Overall Progress: {overallProgress}%</h2>
      {modules.map(module => (
        <div key={module._id}>{module.title}</div>
      ))}
    </div>
  );
}
```

## Components

### VideoPlayer
A reusable video player component that automatically tracks progress:

```typescript
import VideoPlayer from '@/components/VideoPlayer';

<VideoPlayer
  moduleId="module123"
  video={videoData}
  onProgressUpdate={(progress) => console.log(`Progress: ${progress}%`)}
/>
```

### WeeklyLearnProgress
Displays module progress in a card format:

```typescript
import WeeklyLearnProgress from '@/components/WeeklyLearnProgress';

<WeeklyLearnProgress
  weekNumber={1}
  title="Module Title"
  lessonCount={5}
  duration="5 weeks"
  rating={0}
  progress={75}
  status="in-progress"
/>
```

## State Management

The Learn Service manages several types of state:

### Module State
- **not_started**: Module hasn't been accessed
- **in_progress**: Module has been started but not completed
- **completed**: All weeks and content items are finished

### Week State
- **not_started**: Week hasn't been accessed
- **in_progress**: Week has been started but not completed
- **completed**: All content items in the week are finished

### Content Item State
- **not_started**: Content item hasn't been accessed
- **in_progress**: Content item is in progress
- **completed**: Content item has been completed

## Progress Calculations

### Module Progress
```typescript
const progress = learnService.calculateModuleProgress(module);
// Returns percentage (0-100) from module.progress.percentage
```

### Overall Progress
```typescript
const overallProgress = modules.reduce((sum, module) => sum + module.progress.percentage, 0) / modules.length;
```

### Completion Status
```typescript
const isCompleted = learnService.isModuleCompleted(module);
// Returns true if module.progress.status === 'completed'
```

### Content Counts
```typescript
const totalContent = learnService.getTotalContentCount(module);
const completedContent = learnService.getCompletedContentCount(module);
// Returns counts of total and completed content items
```

## Error Handling

All API calls now return the data directly and use axios interceptors for automatic error handling and authentication. The service will:

- Automatically add Authorization headers to requests
- Handle token refresh automatically when tokens expire
- Redirect to login page if authentication fails
- Throw errors that can be caught with try-catch blocks

```typescript
try {
  const courses = await learnService.getPlayerCourses();
  // Use courses directly
} catch (error) {
  // Handle any errors (network, auth, server errors)
  console.error('Failed to fetch courses:', error);
}
```

## Best Practices

1. **Always handle loading states**: Show loading indicators while API calls are in progress
2. **Error boundaries**: Implement proper error handling for failed API calls
3. **Progress persistence**: Save progress locally if needed for offline scenarios
4. **Optimistic updates**: Update UI immediately for better user experience
5. **Rate limiting**: Don't make too many API calls in quick succession

## Testing

The service can be tested by mocking the API responses:

```typescript
// Mock API response
jest.mock('@/service/learn.server', () => ({
  learnService: {
    getPlayerModules: jest.fn().mockResolvedValue(mockModules),
    completeVideo: jest.fn().mockResolvedValue({
      success: true,
      message: 'Video completed successfully'
    })
  }
}));
```
