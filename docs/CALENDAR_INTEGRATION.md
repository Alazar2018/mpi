# Calendar Integration & Notification System

This document describes the integration of the calendar system with real-time notifications and webhooks.

## Overview

The calendar system has been enhanced with:
1. **Real-time API Integration** - Connects to `/api/v1/calendar` endpoints using axios interceptors
2. **WebSocket Notifications** - Real-time updates via WebSocket connections
3. **Socket-based Calendar Refresh** - Automatic calendar refresh when other users modify events
4. **Notification Store** - Centralized state management for notifications
5. **Enhanced Header** - Integrated notification panel with real-time updates

## Features

### Calendar API Integration
- **GET /api/v1/calendar/events** - Fetch calendar events for date ranges
- **GET /api/v1/calendar/upcoming** - Get upcoming events
- Support for multiple view types: day, week, month, year
- Timezone support
- **Axios interceptors** for automatic authentication and token refresh
- Real-time event updates

### Socket-based Calendar Refresh
- **`calendar-refresh` event** - Triggers automatic calendar data refresh
- Real-time synchronization when other users modify calendar events
- No need to manually refresh - calendar stays in sync automatically

### Notification System
- **Real-time WebSocket updates** for calendar events
- **Multiple notification types**: info, success, warning, error
- **Source-based categorization**: calendar, match, training, system
- **Action URLs** for navigation
- **Auto-cleanup** after 30 seconds (except errors)
- **Unread count tracking**

### WebSocket Events
The system listens for these real-time events:
- `calendar-refresh` - **NEW**: Triggers calendar data refresh
- `calendar:event-created` - New calendar event
- `calendar:event-updated` - Event modified
- `calendar:event-cancelled` - Event cancelled
- `calendar:event-reminder` - Event reminder
- `match:scheduled` - New match scheduled
- `match:updated` - Match details updated
- `match:cancelled` - Match cancelled
- `webhook:notification` - Generic webhook notifications

## File Structure

```
src/
├── service/
│   └── calendar.server.ts          # Calendar API service with axios interceptors
├── store/
│   └── notification.store.ts        # Notification state management
├── hooks/
│   └── useNotificationSocket.tsx    # WebSocket hook for notifications + calendar refresh
├── components/
│   ├── Header.tsx                   # Enhanced header with notifications
│   ├── Calendar.tsx                 # Updated calendar component
│   └── NotificationTest.tsx         # Test component for notifications
└── features/
    └── calander_view/
        └── calendar_view.tsx        # Main calendar view with API integration + socket refresh
```

## Usage

### Basic Calendar Usage
```tsx
import { CalendarService } from '@/service/calendar.server';

// Fetch events for a date range
const events = await CalendarService.getEvents({
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-01-31T23:59:59.999Z',
    view: 'month',
    timezone: 'America/New_York'
});

// Get upcoming events
const upcoming = await CalendarService.getUpcomingEvents(5);
```

### Socket-based Calendar Refresh
The calendar automatically refreshes when the `calendar-refresh` event is received:

```tsx
// In useNotificationSocket.tsx
socket.on('calendar-refresh', (data) => {
    console.log('Calendar refresh requested:', data);
    // Emit a custom event that the calendar component can listen to
    window.dispatchEvent(new CustomEvent('calendar-refresh-requested', { detail: data }));
});

// In calendar_view.tsx
useEffect(() => {
    const handleCalendarRefresh = (event: CustomEvent) => {
        console.log('Calendar refresh requested via WebSocket:', event.detail);
        fetchCalendarEvents(); // Refresh calendar data
    };

    window.addEventListener('calendar-refresh-requested', handleCalendarRefresh as EventListener);
    return () => {
        window.removeEventListener('calendar-refresh-requested', handleCalendarRefresh as EventListener);
    };
}, []);
```

### Notification Management
```tsx
import { useNotificationStore } from '@/store/notification.store';

const notificationStore = useNotificationStore();

// Add a notification
notificationStore.addNotification({
    title: 'Event Created',
    message: 'New event has been added to your calendar',
    type: 'success',
    source: 'calendar',
    actionUrl: '/calendar'
});

// Mark as read
notificationStore.markAsRead(notificationId);

// Clear all notifications
notificationStore.clearAll();
```

### WebSocket Integration
```tsx
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

// Automatically connects and handles real-time updates
function MyComponent() {
    useNotificationSocket(); // Initialize WebSocket connection
    // ... rest of component
}
```

## Configuration

### API Configuration
The calendar service now uses axios interceptors automatically. Update `src/config/api.config.ts` to include your calendar API endpoints:

```typescript
CALENDAR: {
    EVENTS: "/api/v1/calendar/events",
    UPCOMING: "/api/v1/calendar/upcoming",
}
```

### WebSocket Configuration
Update the WebSocket URL in `src/hooks/useNotificationSocket.tsx`:

```typescript
// TODO: Update this URL to your actual WebSocket server
const WEBSOCKET_URL = 'http://localhost:4000'; // Change this to your server URL
```

### Axios Interceptors
The calendar service automatically benefits from:
- **Authentication headers** - Automatically added to requests
- **Token refresh** - Handles expired tokens automatically
- **Error handling** - Consistent error handling across the app

## Event Types

### API Event Types
- `match` - Tennis matches
- `training` - Training sessions
- `coaching` - Coaching requests
- `tournament` - Tournament matches
- `practice` - Practice reminders

### Local Event Types
- `match` - Tennis matches
- `training` - Training sessions
- `session` - Practice sessions
- `goal` - Personal goals
- `reminder` - General reminders

## Status Mapping

API statuses are mapped to local statuses:
- `scheduled` → `confirmed`
- `ongoing`, `completed`, `cancelled` → `pending`

## Socket Events

### Calendar Refresh
- **Event**: `calendar-refresh`
- **Purpose**: Triggers automatic calendar data refresh
- **Use Case**: When other users modify calendar events
- **Response**: Calendar automatically fetches latest data

### Other Events
- **Calendar events**: `calendar:event-*`
- **Match events**: `match:*`
- **Training events**: `training:*`
- **System events**: `system:*`
- **Webhook events**: `webhook:notification`

## Testing

A test component (`NotificationTest.tsx`) is included for testing the notification system. It provides buttons to:
- Add different notification types
- Test calendar and match notifications
- Mark all as read
- Clear all notifications

**Note**: Remove this component in production.

## Production Considerations

1. **Remove test components** - Delete `NotificationTest.tsx` before deployment
2. **Update WebSocket URL** - Ensure the WebSocket server URL is correct in `useNotificationSocket.tsx`
3. **Configure calendar-refresh events** - Ensure your backend emits `calendar-refresh` events
4. **Error handling** - Implement proper error boundaries and fallbacks
5. **Performance** - Consider implementing pagination for large event lists
6. **Security** - Ensure proper authentication for WebSocket connections

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check WebSocket server URL in `useNotificationSocket.tsx`
   - Verify network connectivity
   - Check authentication tokens

2. **Calendar Events Not Loading**
   - Verify API endpoints are correct
   - Check API authentication (handled by axios interceptors)
   - Review browser console for errors

3. **Notifications Not Appearing**
   - Ensure notification store is properly initialized
   - Check WebSocket connection status
   - Verify notification component is mounted

4. **Calendar Not Refreshing Automatically**
   - Check if `calendar-refresh` events are being emitted from backend
   - Verify WebSocket connection is active
   - Check browser console for socket events

### Debug Mode

Enable debug logging by checking the browser console for:
- WebSocket connection status
- API request/response logs (with axios interceptors)
- Notification store state changes
- Calendar refresh events

## Backend Integration

### Required WebSocket Events
Your backend should emit these events:

```javascript
// When calendar events are modified by any user
socket.emit('calendar-refresh', {
    userId: 'user-who-modified',
    eventId: 'modified-event-id',
    action: 'created|updated|deleted',
    timestamp: new Date().toISOString()
});

// Other notification events
socket.emit('calendar:event-created', { event: eventData });
socket.emit('match:scheduled', { match: matchData });
// ... etc
```

### Calendar Refresh Flow
1. **User A** modifies a calendar event
2. **Backend** emits `calendar-refresh` event to all connected clients
3. **User B's frontend** receives the event
4. **Calendar automatically refreshes** to show updated data
5. **No manual refresh needed** - real-time synchronization

## Future Enhancements

1. **Push Notifications** - Browser push notifications
2. **Email Integration** - Email notifications for important events
3. **Calendar Sync** - Integration with external calendar services
4. **Advanced Filtering** - Event filtering by type, status, participants
5. **Bulk Operations** - Mass event management
6. **Recurring Events** - Support for recurring calendar events
7. **Conflict Resolution** - Handle simultaneous edits by multiple users
8. **Offline Support** - Queue changes when offline, sync when online
