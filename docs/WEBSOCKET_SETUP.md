# WebSocket Integration Setup

## Overview
This application includes WebSocket integration for real-time notifications and calendar updates. The WebSocket functionality is designed to be configurable and gracefully handle connection failures.

## Configuration

### Environment Variables
Create a `.env` file in your project root with the following variables:

```env
# WebSocket Server URL (default: http://localhost:4000)
VITE_WEBSOCKET_URL=http://your-websocket-server.com

# Enable/disable WebSocket (default: true)
VITE_WEBSOCKET_ENABLED=true
```

### WebSocket Server Requirements
The WebSocket server should support Socket.IO v4+ and handle the following events:

#### Connection Parameters
- `type`: "notifications"
- `userId`: User identifier (currently hardcoded as "current-user-id")

#### Expected Events
- `calendar-refresh`: Triggers calendar data refresh
- `calendar:event-created`: New calendar event
- `calendar:event-updated`: Updated calendar event
- `calendar:event-cancelled`: Cancelled calendar event
- `calendar:event-reminder`: Event reminder
- `match:scheduled`: New match scheduled
- `match:updated`: Match updated
- `match:cancelled`: Match cancelled
- `match:reminder`: Match reminder
- `training:scheduled`: New training session
- `training:reminder`: Training reminder
- `webhook:notification`: Generic webhook notification
- `system:maintenance`: System maintenance notification
- `system:update`: System update notification

## Features

### Automatic Reconnection
- Attempts to reconnect up to 5 times
- 1-second delay between attempts
- Graceful fallback to polling if WebSocket fails

### Error Handling
- Connection errors are logged and displayed
- Failed connections don't break the application
- Graceful degradation when WebSocket is unavailable

### Calendar Integration
- WebSocket events automatically trigger calendar refreshes
- Real-time updates for calendar events
- Custom events dispatched to calendar components

## Troubleshooting

### WebSocket Connection Fails
1. Check if the WebSocket server is running
2. Verify the `VITE_WEBSOCKET_URL` environment variable
3. Check browser console for connection errors
4. Ensure the server supports Socket.IO v4+

### Notifications Not Working
1. Verify WebSocket connection status
2. Check if the server is sending events in the expected format
3. Review browser console for event handling errors
4. Ensure notification store is properly initialized

### Performance Issues
1. WebSocket is disabled by default if connection fails
2. Connection attempts are limited to prevent spam
3. Fallback to polling if WebSocket transport fails

## Development

### Local Development
For local development, you can:
1. Set `VITE_WEBSOCKET_ENABLED=false` to disable WebSocket
2. Use a local WebSocket server (e.g., Node.js + Socket.IO)
3. Mock WebSocket events for testing

### Testing
The WebSocket integration includes:
- Connection status monitoring
- Error logging and display
- Graceful fallback mechanisms
- Event handling validation

## Security Notes
- WebSocket connections use the same authentication as HTTP requests
- User ID should be obtained from authentication store (currently hardcoded)
- Consider implementing proper authentication for WebSocket connections
- Validate all incoming WebSocket events on the server side
