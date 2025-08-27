# Todo Integration with General Dashboard

## Overview
This document describes the integration of the todo feature with the general dashboard for coach and parent roles in the MPI SPA application.

## Features

### 1. Todo Service (`src/service/todo.server.ts`)
- **Complete API Integration**: Implements all 7 TODO API endpoints from the documentation
- **Axios Interceptors**: Uses existing authentication and token refresh system
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Advanced Features**: Priority sorting, date formatting, status checking

#### Key Methods:
- `createTodo()` - Create new todos
- `getAllTodos()` - Get todos with pagination and filtering
- `getLatestTodos()` - Get 3 most recent todos for dashboard
- `updateTodo()` - Update todo details
- `toggleTodoStatus()` - Quick status toggle
- `deleteTodo()` - Delete todo
- `getTodosDueToday()` - Filter todos due today
- `getOverdueTodos()` - Get overdue todos
- `getUpcomingTodos()` - Get todos due in next 7 days

### 2. TodoSection Component (`src/components/TodoSection.tsx`)
- **Real-time Management**: Create, edit, delete, and toggle todos
- **Priority Visualization**: Color-coded priority system (overdue, due soon, normal)
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Error Handling**: Comprehensive error states and retry functionality
- **Loading States**: Smooth loading animations and user feedback

#### Features:
- Add new tasks with due dates and timezone support
- Edit existing tasks inline
- Toggle completion status with visual feedback
- Delete tasks with confirmation
- Priority-based sorting (overdue first, then due soon)
- Quick stats dashboard (pending, completed, overdue counts)

### 3. Dashboard Integration (`src/components/GeneralDashboard.tsx`)
- **Role-based Access**: Only visible to coaches and parents
- **KPI Integration**: Pending tasks count in dashboard metrics
- **Seamless UX**: Integrated with existing dashboard layout
- **Real-time Updates**: Todo counts update automatically

### 4. Custom Hook (`src/hooks/useCoachParentDashboard.ts`)
- **Data Management**: Centralized todo data fetching
- **Role Validation**: Ensures only authorized users can access
- **Error Handling**: Graceful fallbacks and user feedback
- **Performance**: Efficient data fetching with proper caching

## Usage

### For Coaches:
```typescript
import { todoService } from '@/service/todo.server';

// Create a new task
const newTodo = await todoService.createTodo({
  title: "Review player progress reports",
  dueDate: "2024-08-20T10:00:00Z",
  timezone: "America/New_York"
});

// Get latest tasks for dashboard
const latestTasks = await todoService.getLatestTodos();

// Toggle task completion
await todoService.toggleTodoStatus(todoId, currentStatus);
```

### For Parents:
```typescript
// Same API as coaches
const parentTasks = await todoService.getLatestTodos();
```

### Dashboard Integration:
```typescript
import { useCoachParentDashboard } from '@/hooks/useCoachParentDashboard';

const { pendingTodos, completedTodos, refreshDashboard } = useCoachParentDashboard();
```

## API Endpoints Used

The integration uses the following TODO API endpoints:

1. **POST** `/api/v1/todos` - Create todo
2. **GET** `/api/v1/todos` - Get all todos with filtering
3. **GET** `/api/v1/todos/latest` - Get latest 3 todos
4. **GET** `/api/v1/todos/{id}` - Get specific todo
5. **PATCH** `/api/v1/todos/{id}` - Update todo
6. **PATCH** `/api/v1/todos/{id}/status` - Update status
7. **DELETE** `/api/v1/todos/{id}` - Delete todo

## Authentication

- **JWT Integration**: Uses existing axios interceptors
- **Automatic Token Refresh**: Handled by axios configuration
- **Role-based Access**: Only coaches and parents can access
- **Secure API Calls**: All requests include proper authorization headers

## UI Components

### Priority System:
- 🔴 **Red Border**: Overdue tasks
- 🟠 **Orange Border**: Due within 24 hours
- ⚪ **Gray Border**: Normal priority

### Status Indicators:
- ✅ **Green Check**: Completed tasks
- ⭕ **Gray Circle**: Pending tasks

### Color Scheme:
- **Green to Blue Gradient**: Primary actions and headers
- **Red**: Overdue and error states
- **Orange**: Due soon warnings
- **Gray**: Neutral and disabled states

## Error Handling

- **Network Errors**: Graceful fallbacks with retry options
- **API Errors**: User-friendly error messages
- **Validation Errors**: Form validation with helpful feedback
- **Loading States**: Clear indication of ongoing operations

## Performance Features

- **Efficient Filtering**: Client-side filtering for better UX
- **Smart Sorting**: Priority-based sorting algorithm
- **Optimistic Updates**: Immediate UI updates with API fallbacks
- **Debounced Search**: Efficient search functionality

## Future Enhancements

- **Bulk Operations**: Select multiple todos for batch actions
- **Recurring Tasks**: Set up repeating todo patterns
- **Task Categories**: Organize todos by project or type
- **Push Notifications**: Reminders for due tasks
- **Export Functionality**: Download todo lists in various formats
- **Collaboration**: Share todos with team members

## Testing

The integration includes:
- **Error Scenarios**: Network failures, API errors, validation errors
- **Loading States**: Proper loading indicators and transitions
- **User Interactions**: All CRUD operations with proper feedback
- **Responsive Design**: Mobile and desktop compatibility

## Dependencies

- **React**: Component framework
- **TypeScript**: Type safety and development experience
- **Lucide React**: Icon library
- **Axios**: HTTP client with interceptors
- **Tailwind CSS**: Styling and responsive design

## File Structure

```
src/
├── service/
│   └── todo.server.ts          # Todo API service
├── components/
│   ├── GeneralDashboard.tsx    # Main dashboard with todo integration
│   └── TodoSection.tsx         # Dedicated todo management component
├── hooks/
│   └── useCoachParentDashboard.ts  # Todo dashboard data hook
└── config/
    └── axios.config.ts         # Axios configuration with interceptors
```

## Getting Started

1. **Import the service**:
   ```typescript
   import { todoService } from '@/service/todo.server';
   ```

2. **Use in components**:
   ```typescript
   import TodoSection from '@/components/TodoSection';
   ```

3. **Add to dashboard**:
   ```typescript
   {(userRole === 'coach' || userRole === 'parent') && (
     <TodoSection userRole={userRole} />
   )}
   ```

4. **Access dashboard data**:
   ```typescript
   import { useCoachParentDashboard } from '@/hooks/useCoachParentDashboard';
   ```

The todo integration is now fully functional and provides a comprehensive task management solution for coaches and parents in the general dashboard.
