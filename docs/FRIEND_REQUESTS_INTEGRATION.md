# Friend Requests Integration

This document describes the integration of the Friend Requests functionality with the backend API.

## Overview

The Friend Requests section has been integrated with the backend API to provide real-time friend request management for users. The integration includes:

- **API Service Layer**: `src/service/friendrequest.server.ts`
- **Custom Hook**: `src/hooks/useFriendRequests.ts`
- **Component**: `src/components/FriendRequestCard.tsx`
- **Integration**: Updated `src/features/players/players.tsx`

## API Endpoints

### Get Friend Requests
```http
GET /api/v1/friendship/friendRequest
```
**Description**: Retrieve all pending friend requests for the authenticated user  
**Access**: Authenticated users only  
**Response**: Array of friend requests with pagination

**Query Parameters**:
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 20)
- `sort` (optional): Sort field (default: -createdAt)

### Accept Friend Request
```http
PUT /api/v1/friendship/:id/accept
```
**Description**: Accept a pending friend request  
**Access**: Authenticated users only  
**Parameters**: `id` - Friendship request ID

### Reject Friend Request
```http
DELETE /api/v1/friendship/:id/reject
```
**Description**: Reject a pending friend request  
**Access**: Authenticated users only  
**Parameters**: `id` - Friendship request ID

## Data Models

### User Interface
```typescript
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  isOnline: boolean;
  avatar?: string;
}
```

### Friend Request Interface
```typescript
interface FriendRequest {
  _id: string;
  user1: User;
  user2: User;
  status: 'request' | 'friends' | 'rejected';
  friendRequestSentAt: string;
  notification: boolean;
  createdAt: string;
}
```

### Friend Request List Response
```typescript
interface FriendRequestListResponse {
  result: number;
  friendRequests: FriendRequest[];
}
```

## Service Layer

The `FriendRequestService` class provides methods for:

- `getFriendRequests()` - Fetch paginated list of friend requests
- `acceptFriendRequest()` - Accept a friend request
- `rejectFriendRequest()` - Reject a friend request
- `getFriendRequestsCount()` - Get total count of friend requests
- `getPendingFriendRequests()` - Get only pending requests
- Utility methods for data transformation and formatting

## Custom Hook

The `useFriendRequests` hook provides:

- **State Management**: Friend requests data, loading states, error handling
- **Pagination**: Page management and navigation
- **Actions**: Accept and reject friend request functionality
- **Auto-refresh**: Automatic data refreshing for real-time updates
- **Data Fetching**: Automatic data fetching and error handling

### Usage Example
```typescript
const {
  friendRequests,
  loading,
  error,
  totalRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  refreshFriendRequests
} = useFriendRequests({ 
  limit: 3,
  autoRefresh: true,
  refreshInterval: 30000
});
```

## Component Integration

The `FriendRequestCard` component displays:

- **User Avatar**: Profile picture or generated initials with colors
- **User Information**: Name and online status
- **Request Details**: When the request was sent
- **Action Buttons**: Accept and reject buttons with loading states
- **Notification Badge**: Visual indicator for unread requests

## Features

### Real-time Updates
- Auto-refresh functionality every 30 seconds
- Immediate UI updates when accepting/rejecting requests
- Loading states for all actions

### User Experience
- Beautiful avatar generation with consistent colors
- Online/offline status indicators
- Relative time formatting (e.g., "2h ago")
- Responsive design with hover effects

### Error Handling
- Comprehensive error states with retry functionality
- Loading indicators for all async operations
- Graceful fallbacks for missing data

## Integration with Players Component

The friend requests are now integrated into the "Recent Invitations" tab in the players component:

- **Loading States**: Skeleton loaders while fetching data
- **Error Handling**: Error states with retry options
- **Empty States**: Message when no pending requests exist
- **Real-time Updates**: Automatic refresh and immediate UI updates

## API Response Handling

The service handles various API response structures:

- **Success Responses**: Properly typed and validated
- **Error Responses**: Comprehensive error handling and logging
- **Data Validation**: Ensures response structure matches expectations
- **Fallback Data**: Graceful handling of missing or invalid data

## Security Features

- **Authentication**: JWT token-based authentication
- **Authorization**: User-specific friend request access
- **Data Validation**: Input sanitization and validation
- **Secure Headers**: HTTPS and proper CORS configuration

## Performance Optimizations

- **Lazy Loading**: Load data only when needed
- **Pagination**: Limit data transfer per request
- **Caching**: Efficient state management
- **Auto-refresh**: Configurable refresh intervals

## Future Enhancements

Potential improvements for the friend requests integration:

- **Push Notifications**: Real-time push notifications for new requests
- **Request History**: View accepted/rejected request history
- **Bulk Actions**: Accept/reject multiple requests at once
- **Advanced Filtering**: Filter by date, user type, etc.
- **Request Analytics**: Insights into friend request patterns

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check JWT token validity and refresh
2. **Network Timeouts**: Verify API endpoint accessibility
3. **Data Loading Issues**: Check API response format
4. **Action Failures**: Verify request ID and user permissions

### Debug Information

Enable console logging for debugging:
```typescript
// In friendrequest.server.ts
console.log('Friend Requests API Response:', response.data);
```

## Dependencies

- **Axios**: HTTP client for API requests
- **React Hooks**: State management and side effects
- **TypeScript**: Type safety and interfaces
- **Tailwind CSS**: Styling and responsive design

## Testing

The integration can be tested using:

- **API Testing**: Postman or similar tools
- **Component Testing**: React Testing Library
- **Integration Testing**: End-to-end testing
- **Performance Testing**: Load testing for large datasets
