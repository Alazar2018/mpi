# Notification System Maintenance Guide

## Overview
This document provides comprehensive maintenance information for the MPI notification system, including API integration, store management, and UI components.

## Architecture

### Core Components
- **`src/service/notifications.server.ts`** - API service layer
- **`src/store/notification.store.ts`** - Zustand store for state management
- **`src/features/notifications/notifications.tsx`** - Main notifications page
- **`src/components/Header.tsx`** - Notification dropdown in header

### Data Flow
```
API Response → Service Layer → Store → UI Components
     ↓              ↓         ↓        ↓
Raw Data → Transformed → State → Rendered
```

## API Integration

### Endpoints
```typescript
// Base notification endpoints
GET    /api/v1/notifications          // List notifications
GET    /api/v1/notifications/stats    // Get notification statistics
POST   /api/v1/notifications/:id/read // Mark as read
POST   /api/v1/notifications/read     // Mark all as read
DELETE /api/v1/notifications/:id      // Delete notification
```

### Response Formats
The system handles multiple API response formats:

#### Format 1: Standard Response
```json
{
  "success": true,
  "stats": {
    "unread": 5,
    "total": 25,
    "read": 20,
    "byType": { "match": 3, "class": 2 },
    "byPriority": { "high": 1, "normal": 4 },
    "deviceInfo": { "totalActiveSessions": 10 }
  }
}
```

#### Format 2: Status-based Response
```json
{
  "status": "success",
  "data": {
    "unread": 5,
    "total": 25
  }
}
```

#### Format 3: Direct Count Response
```json
{
  "unreadCount": 5,
  "totalCount": 25
}
```

### Service Methods

#### `getNotificationStats()`
- **Purpose**: Fetch notification statistics
- **Returns**: `NotificationStatsResponse`
- **Fallback**: Provides complete fallback object if API fails
- **Error Handling**: Silent fail with default values

#### `getNotifications(filters)`
- **Purpose**: Fetch paginated notifications
- **Parameters**: `NotificationFilters` object
- **Returns**: `NotificationListResponse`
- **Transforms**: API data to frontend format

#### `markAsRead(id)`
- **Purpose**: Mark single notification as read
- **Parameters**: Notification ID string
- **Returns**: Promise<void>

#### `markAllAsRead()`
- **Purpose**: Mark all notifications as read
- **Returns**: Promise<void>

#### `deleteNotification(id)`
- **Purpose**: Delete a notification
- **Parameters**: Notification ID string
- **Returns**: Promise<void>

## Store Management

### State Structure
```typescript
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
```

### Key Actions
- **`addNotification`**: Add new notification to store
- **`markAsRead`**: Mark notification as read
- **`markAllAsRead`**: Mark all notifications as read
- **`removeNotification`**: Remove notification from store
- **`clearAll`**: Clear all notifications
- **`syncWithAPI`**: Sync unread count with API

### WebSocket Handlers
- **`handleWebhookNotification`**: Process webhook notifications
- **`handleCalendarUpdate`**: Handle calendar event updates
- **`handleMatchUpdate`**: Handle match updates

## UI Components

### Header Notification Dropdown
- **Location**: `src/components/Header.tsx`
- **Features**: 
  - Real-time unread count
  - Recent notifications preview
  - "See All Notifications" button (bottom position)
  - Auto-refresh on new notifications

### Notifications Page
- **Location**: `src/features/notifications/notifications.tsx`
- **Features**:
  - Paginated notification list
  - Type and priority filtering
  - Read/unread status filtering
  - Bulk actions (mark all as read)
  - Individual notification actions

### Notification Types
```typescript
type NotificationType = 
  | 'match' 
  | 'class' 
  | 'friendship' 
  | 'announcement' 
  | 'user_added' 
  | 'periodization' 
  | 'comment' 
  | 'general';
```

### Priority Levels
```typescript
type NotificationPriority = 'high' | 'normal' | 'low';
```

## Error Handling

### API Failures
- **Silent Fallbacks**: Default to safe values (0 unread, empty arrays)
- **User Feedback**: Error states in UI with retry options
- **Graceful Degradation**: System continues to function with limited data

### Network Issues
- **Retry Logic**: Automatic retry on connection restore
- **Offline Support**: Cache last known state
- **User Notification**: Clear error messages for user actions

## Performance Optimization

### Data Fetching
- **Pagination**: 20 notifications per page
- **Lazy Loading**: Load notifications on demand
- **Caching**: Store notifications in Zustand store
- **Debouncing**: Prevent rapid API calls

### UI Rendering
- **Virtual Scrolling**: For large notification lists
- **Memoization**: Prevent unnecessary re-renders
- **Skeleton Loading**: Show loading states during fetch

## Maintenance Tasks

### Regular Checks
1. **API Response Validation**: Verify response format changes
2. **Error Rate Monitoring**: Check console for failed API calls
3. **Performance Metrics**: Monitor notification load times
4. **User Feedback**: Review notification-related user reports

### Common Issues

#### Issue: Invalid notification stats response
**Symptoms**: `TypeError: Cannot read properties of undefined (reading 'unread')`
**Cause**: API response format mismatch
**Solution**: Update `getNotificationStats()` fallback logic

#### Issue: Notifications not updating
**Symptoms**: Stale notification data
**Cause**: Store not syncing with API
**Solution**: Check `syncWithAPI()` calls and WebSocket connections

#### Issue: High API call frequency
**Symptoms**: Excessive network requests
**Cause**: Missing pagination or caching
**Solution**: Implement proper pagination and cache invalidation

### Debugging

#### Enable Debug Logs
```typescript
// Temporarily add to notifications.server.ts
console.log('🔍 Raw response:', response.data);
console.log('🔍 Transformed:', { success, stats });
```

#### Check Network Tab
- Monitor `/api/v1/notifications` calls
- Verify response status codes
- Check for failed requests

#### Store State Inspection
```typescript
// In browser console
const store = useNotificationStore.getState();
console.log('Store state:', store);
```

## Testing

### Unit Tests
- Service layer API calls
- Store state mutations
- UI component rendering
- Error handling scenarios

### Integration Tests
- End-to-end notification flow
- API response handling
- WebSocket integration
- Error recovery

### Manual Testing
1. **Create notifications** via different sources
2. **Mark as read** individual and bulk
3. **Delete notifications** and verify state
4. **Test filters** and pagination
5. **Verify real-time updates** via WebSocket

## Future Enhancements

### Planned Features
- **Push Notifications**: Browser and mobile push support
- **Notification Preferences**: User-configurable settings
- **Advanced Filtering**: Date range, sender, content search
- **Bulk Operations**: Select multiple notifications for actions
- **Notification Templates**: Customizable notification formats

### Technical Improvements
- **Service Worker**: Offline notification support
- **IndexedDB**: Local notification storage
- **WebSocket Reconnection**: Improved connection reliability
- **Performance Monitoring**: Real-time performance metrics

## Troubleshooting Checklist

- [ ] Check API endpoint availability
- [ ] Verify response format compatibility
- [ ] Check WebSocket connection status
- [ ] Review store state consistency
- [ ] Monitor error rates and types
- [ ] Test notification creation flow
- [ ] Verify real-time updates
- [ ] Check browser console for errors
- [ ] Review network request patterns
- [ ] Validate notification data integrity

## Support Contacts

- **Frontend Team**: UI/UX issues and component bugs
- **Backend Team**: API response format and endpoint issues
- **DevOps Team**: WebSocket connection and infrastructure issues
- **QA Team**: Testing and user experience validation

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Maintainer**: [Your Name]
