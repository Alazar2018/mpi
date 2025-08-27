# Notifications System

This feature provides a comprehensive notifications system for the MPI SPA application, integrating with the backend API and providing real-time updates.

## Features

- **Real-time Notifications**: Fetch notifications from the API with automatic updates
- **Smart Filtering**: Filter by type, priority, and read status
- **Pagination**: Handle large numbers of notifications efficiently
- **Mark as Read**: Individual and bulk mark as read functionality
- **Navigation**: Click notifications to navigate to relevant pages
- **Priority System**: High, normal, and low priority notifications
- **Type-based Icons**: Visual indicators for different notification types

## Components

### 1. NotificationsPage (`notifications.tsx`)
The main notifications page that displays all notifications with filtering and pagination.

**Features:**
- Display notifications in a clean, organized list
- Filter by type, priority, and read status
- Sort by creation date or priority
- Pagination for large datasets
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications
- Navigate to notification details

### 2. TestNotifications (`test-notifications.tsx`)
A development component for creating test notifications to verify the system works.

**Usage:**
- Enter a message and create test notifications
- Useful for testing the notifications flow
- Creates real notifications in the system

## API Integration

The system integrates with the following API endpoints:

- `GET /api/v1/notifications` - Fetch notifications with filtering
- `GET /api/v1/notifications/stats` - Get notification statistics
- `PATCH /api/v1/notifications/read` - Mark all as read
- `PATCH /api/v1/notifications/:id/read` - Mark specific as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `POST /api/v1/notifications` - Create notification (testing)

## Notification Types

The system supports these notification types:
- `match` - Match-related notifications
- `class` - Class/training notifications
- `friendship` - Friend request notifications
- `announcement` - System announcements
- `user_added` - User relationship changes
- `periodization` - Training periodization
- `comment` - Comment notifications
- `general` - General notifications

## Priority Levels

- **High** - Important notifications requiring immediate attention
- **Normal** - Standard notifications (default)
- **Low** - Non-urgent notifications

## State Management

The notifications system uses Zustand for state management with the following store:

- `notifications` - Array of notification objects
- `unreadCount` - Count of unread notifications
- `isLoading` - Loading state for API calls
- `error` - Error state for failed operations

## Usage

### In Header Component
The header includes a notifications dropdown with:
- Quick view of recent notifications
- Unread count badge
- "See All Notifications" link
- Mark all as read functionality

### Navigation
Click on any notification to:
- Mark it as read automatically
- Navigate to the relevant page (if route is provided)
- View additional details

### Filtering
Use the filter controls to:
- Show only specific notification types
- Filter by priority level
- Show only read or unread notifications
- Sort by creation date or priority

## Styling

The system uses Tailwind CSS with:
- Responsive design for mobile and desktop
- Consistent color scheme based on notification type
- Hover effects and transitions
- Loading states and error handling
- Clean, modern UI components

## Development

### Adding New Notification Types
1. Add the new type to the API service
2. Update the icon mapping in `getNotificationIcon()`
3. Update the color mapping in `getNotificationColor()`
4. Add the type to the filter dropdown

### Testing
Use the `TestNotifications` component to create test notifications and verify the system works correctly.

### Customization
The system is designed to be easily customizable:
- Modify notification display format
- Add new filtering options
- Customize notification actions
- Extend the API integration

## Dependencies

- React 18+
- Zustand for state management
- Axios for API calls
- React Router for navigation
- Tailwind CSS for styling
- Custom icon system
