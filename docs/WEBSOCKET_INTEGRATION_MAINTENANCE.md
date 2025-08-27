# WebSocket Integration Maintenance Guide

## Overview
This document provides comprehensive maintenance information for the MPI WebSocket integration system, including real-time notifications, chat functionality, and connection management.

## Architecture

### Core Components
- **`src/config/websocket.config.ts`** - Configuration and environment variables
- **`src/service/socket.server.ts`** - Socket.IO service layer
- **`src/hooks/useNotificationSocket.tsx`** - Notification WebSocket hook
- **`src/hooks/useSocket.tsx`** - General WebSocket hook
- **`src/hooks/useChat.ts`** - Chat-specific WebSocket integration

### Connection Flow
```
Environment Config → Socket Service → Event Handlers → UI Components
       ↓               ↓              ↓              ↓
   VITE_WEBSOCKET_URL → io() → on('event') → State Update
```

## Configuration

### Environment Variables
```bash
# .env.local
VITE_WEBSOCKET_URL=http://46.202.93.201:4000
VITE_WEBSOCKET_ENABLED=true
```

### WebSocket Config
```typescript
export const WEBSOCKET_CONFIG = {
  URL: import.meta.env.VITE_WEBSOCKET_URL || 'http://46.202.93.201:4000',
  ENABLED: true,
  CONNECTION: {
    transports: ['websocket'],
    autoConnect: false,
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
  QUERY: {
    client: 'web',
    version: '1.0.0'
  }
};
```

### Connection Settings
- **Protocol**: HTTP (not HTTPS) for WebSocket connection
- **Port**: 4000
- **Transports**: WebSocket only (no polling fallback)
- **Auto-connect**: Disabled (manual connection control)
- **Timeout**: 20 seconds
- **Reconnection**: Enabled with exponential backoff

## Socket Service Layer

### Core Service: `SocketService`
**Location**: `src/service/socket.server.ts`

#### Key Methods
```typescript
class SocketService {
  // Connection management
  connect(): void
  disconnect(): void
  isReady(): boolean
  
  // User management
  setupUser(userId: string, userInfo: UserInfo): void
  
  // Chat operations
  joinChat(chatId: string): void
  leaveChat(chatId: string): void
  sendMessage(chatId: string, message: string): void
  
  // Typing indicators
  startTyping(chatId: string): void
  stopTyping(chatId: string): void
  
  // Event handling
  on(event: string, handler: Function): void
  off(event: string, handler?: Function): void
}
```

#### Event Handlers
```typescript
// Connection events
'socket_connected' → { socketId: string }
'socket_disconnected' → { reason: string }

// Message events
'receive_message' → MessageData
'message_delivered' → { messageId: string, chatId: string }
'queued_messages' → MessageData[]

// Chat events
'user_joined' → { userId: string, chatId: string }
'user_left' → { userId: string, chatId: string }
'chat_list_updated' → { chatId: string, updates: any }

// Error events
'socket_error' → Error
'socket_validation_error' → ValidationError
'socket_rate_limit_exceeded' → RateLimitError
```

### Notification WebSocket Hook
**Location**: `src/hooks/useNotificationSocket.tsx`

#### Features
- **Automatic connection** on component mount
- **Channel subscription** (calendar, matches, training, system)
- **Real-time updates** for various notification types
- **Connection status** monitoring
- **Error handling** with user feedback

#### Event Types
```typescript
// Calendar events
'calendar:event-created' → { event: CalendarEvent, action: 'created' }
'calendar:event-updated' → { event: CalendarEvent, action: 'updated' }
'calendar:event-cancelled' → { event: CalendarEvent, action: 'cancelled' }
'calendar:reminder' → { event: CalendarEvent, timeUntil: string }

// Match events
'match:scheduled' → { match: Match, action: 'scheduled' }
'match:updated' → { match: Match, action: 'updated' }
'match:cancelled' → { match: Match, action: 'cancelled' }
'match:reminder' → { match: Match, timeUntil: string }

// Training events
'training:scheduled' → { training: Training, action: 'scheduled' }
'training:reminder' → { training: Training, timeUntil: string }

// System events
'system:maintenance' → { message: string, id: string }
'system:update' → { message: string, id: string }

// Generic webhooks
'webhook:notification' → { type: string, title: string, message: string }
```

## Chat Integration

### Chat WebSocket Hook
**Location**: `src/hooks/useChat.ts`

#### Features
- **Real-time messaging** with optimistic UI
- **Typing indicators** for user experience
- **Message delivery** confirmation
- **Chat room management** (join/leave)
- **Offline message queuing**

#### Message Flow
```
User Input → Optimistic UI → Socket Emit → Server → Broadcast → Other Users
     ↓           ↓            ↓          ↓        ↓          ↓
  Immediate   Show Message  Send Data  Process  Send to All  Update UI
```

### DMChat Component Integration
**Location**: `src/features/connect/components/DMChat.tsx`

#### WebSocket Events
- **`receive_message`**: Handle incoming messages
- **`message_delivered`**: Update message status
- **`typing_update`**: Show typing indicators
- **`user_joined/left`**: Update user presence

## Connection Management

### Connection States
```typescript
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}
```

### Connection Lifecycle
1. **Initialization**: Create socket instance
2. **Setup**: Configure event handlers
3. **Connection**: Manual connect() call
4. **Authentication**: Setup user profile
5. **Subscription**: Join notification channels
6. **Monitoring**: Track connection health
7. **Reconnection**: Automatic retry on failure

### Error Handling

#### Connection Errors
```typescript
socket.on('connect_error', (error) => {
  // Handle connection failures
  // Set error state
  // Attempt reconnection
});
```

#### Common Error Types
- **Network errors**: Connection refused, timeout
- **Authentication errors**: Invalid credentials
- **Rate limiting**: Too many requests
- **Validation errors**: Invalid data format

### Reconnection Strategy
```typescript
const reconnectionConfig = {
  attempts: 5,
  delay: 1000,
  backoff: 1.5,
  maxDelay: 10000
};
```

## Performance Optimization

### Connection Efficiency
- **Single socket instance** per application
- **Event delegation** to prevent memory leaks
- **Connection pooling** for multiple chat rooms
- **Message batching** for high-frequency updates

### Memory Management
- **Event handler cleanup** on component unmount
- **Message history limits** to prevent memory bloat
- **Connection state caching** for offline scenarios
- **Garbage collection** of old message objects

### Network Optimization
- **Message compression** for large payloads
- **Connection keepalive** to maintain stability
- **Heartbeat monitoring** for connection health
- **Graceful degradation** on poor connections

## Security Considerations

### Authentication
- **User token validation** on connection
- **Session management** with server
- **Permission checking** for chat rooms
- **Rate limiting** enforcement

### Data Validation
- **Input sanitization** for user messages
- **Payload size limits** to prevent abuse
- **Type checking** for all incoming data
- **Malicious content filtering**

### Privacy Protection
- **End-to-end encryption** for sensitive chats
- **User consent** for notifications
- **Data retention policies** compliance
- **GDPR compliance** for EU users

## Monitoring and Debugging

### Connection Health Checks
```typescript
// Monitor connection status
setInterval(() => {
  const status = socket.getConnectionStatus();
  if (!status.isConnected) {
    console.warn('WebSocket disconnected, attempting reconnect...');
    socket.connect();
  }
}, 30000); // Check every 30 seconds
```

### Performance Metrics
- **Connection latency** measurement
- **Message delivery time** tracking
- **Reconnection frequency** monitoring
- **Error rate** calculation

### Debug Tools
```typescript
// Enable debug mode
localStorage.setItem('websocket_debug', 'true');

// Monitor all events
socket.onAny((eventName, ...args) => {
  if (localStorage.getItem('websocket_debug') === 'true') {
    console.log(`🔌 [WebSocket] ${eventName}:`, args);
  }
});
```

## Troubleshooting

### Common Issues

#### Issue: WebSocket connection failed
**Symptoms**: `WebSocket is not available` errors
**Causes**: 
- Wrong protocol (HTTPS vs HTTP)
- Firewall blocking port 4000
- Server not running
- Network connectivity issues

**Solutions**:
1. Verify `VITE_WEBSOCKET_URL` protocol
2. Check server status
3. Test network connectivity
4. Review firewall settings

#### Issue: Messages not sending
**Symptoms**: Messages appear locally but not delivered
**Causes**:
- Socket not connected
- User not authenticated
- Chat room not joined
- Server validation errors

**Solutions**:
1. Check connection status
2. Verify user authentication
3. Ensure chat room membership
4. Review server logs

#### Issue: Frequent disconnections
**Symptoms**: Connection drops every few minutes
**Causes**:
- Network instability
- Server timeout settings
- Client-side issues
- Load balancer problems

**Solutions**:
1. Implement exponential backoff
2. Add connection health monitoring
3. Review server configuration
4. Check network stability

### Debug Checklist
- [ ] Verify environment variables
- [ ] Check server availability
- [ ] Monitor connection status
- [ ] Review event handlers
- [ ] Check authentication state
- [ ] Verify chat room membership
- [ ] Monitor error rates
- [ ] Test reconnection logic

## Testing

### Unit Tests
- **Socket service methods** functionality
- **Event handler registration** and removal
- **Connection state management**
- **Error handling scenarios**

### Integration Tests
- **End-to-end messaging** flow
- **Real-time notification** delivery
- **Connection recovery** after failures
- **Multi-user chat** scenarios

### Load Testing
- **High message volume** handling
- **Multiple concurrent users** support
- **Connection stability** under load
- **Memory usage** monitoring

## Maintenance Tasks

### Daily
- [ ] Monitor connection status
- [ ] Check error rates
- [ ] Verify notification delivery
- [ ] Review performance metrics

### Weekly
- [ ] Analyze connection patterns
- [ ] Review error logs
- [ ] Test reconnection logic
- [ ] Update connection timeouts

### Monthly
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Documentation updates
- [ ] Infrastructure health check

## Future Enhancements

### Planned Features
- **WebRTC integration** for peer-to-peer communication
- **File sharing** with progress tracking
- **Voice messages** support
- **Group chat** enhancements
- **Message encryption** improvements

### Technical Improvements
- **Service Worker** for offline support
- **IndexedDB** for message persistence
- **WebSocket compression** for bandwidth optimization
- **Connection multiplexing** for multiple services

## Support and Resources

### Documentation
- **Socket.IO official docs**: https://socket.io/docs/
- **WebSocket API reference**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **MPI WebSocket API**: [Internal documentation]

### Tools
- **Socket.IO admin UI**: Monitor connections and events
- **WebSocket testing tools**: Test connections manually
- **Network analyzers**: Debug connection issues
- **Performance profilers**: Optimize message handling

### Team Contacts
- **Frontend Team**: WebSocket client implementation
- **Backend Team**: WebSocket server and API
- **DevOps Team**: Infrastructure and monitoring
- **QA Team**: Testing and validation

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Maintainer**: [Your Name]
