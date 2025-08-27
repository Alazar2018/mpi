# Chat Integration Maintenance Guide

## Overview
This document provides comprehensive maintenance information for the MPI chat integration system, including direct messaging, group chats, real-time updates, and message management.

## Architecture

### Core Components
- **`src/features/connect/components/DMChat.tsx`** - Direct message chat component
- **`src/features/connect/messages.tsx`** - Messages list and management
- **`src/hooks/useMessages.ts`** - Chat messages hook with WebSocket integration
- **`src/hooks/useChat.ts`** - Chat-specific WebSocket hook
- **`src/service/message.server.ts`** - Message API service layer
- **`src/service/socket.server.ts`** - WebSocket service for real-time updates

### Data Flow
```
User Input → Message Hook → Socket Service → API → Database → Broadcast → Other Users
     ↓           ↓            ↓          ↓       ↓         ↓          ↓
  UI Update   State Change  Emit Event  Store  Persist  Send to All  Update UI
```

## Message Management

### Message Structure
```typescript
interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  senderInfo: {
    name: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file' | 'emoji';
  timestamp: string;
  isRead: boolean;
  readBy: string[];
  metadata?: {
    replyTo?: string;
    mentions?: string[];
    custom?: any;
  };
}
```

### Message Types
- **Text messages**: Standard text content
- **Image messages**: Image files with preview
- **File messages**: Document and media files
- **Emoji messages**: Emoji reactions and responses
- **System messages**: Chat events and notifications

### Message States
```typescript
enum MessageState {
  SENDING = 'sending',      // Being sent to server
  SENT = 'sent',           // Delivered to server
  DELIVERED = 'delivered', // Received by recipient
  READ = 'read',           // Read by recipient
  FAILED = 'failed'        // Failed to send
}
```

## API Integration

### Message Endpoints
```typescript
// Message management
GET    /api/v1/messages/:chatId          // Get chat messages
POST   /api/v1/messages                  // Send new message
PUT    /api/v1/messages/:id              // Update message
DELETE /api/v1/messages/:id              // Delete message
POST   /api/v1/messages/:id/read         // Mark message as read

// Chat management
GET    /api/v1/chats                     // Get user chats
POST   /api/v1/chats                     // Create new chat
GET    /api/v1/chats/:id                 // Get chat details
PUT    /api/v1/chats/:id                 // Update chat
DELETE /api/v1/chats/:id                 // Delete chat
```

### Service Methods

#### `messageService.getMessages(chatId, options)`
- **Purpose**: Fetch chat messages with pagination
- **Parameters**: `chatId`, `options` (limit, offset, sort)
- **Returns**: `MessageListResponse`
- **Features**: Pagination, sorting, filtering

#### `messageService.sendMessage(messageData)`
- **Purpose**: Send new message to chat
- **Parameters**: `MessageData` object
- **Returns**: `MessageResponse`
- **Features**: Validation, file handling, metadata

#### `messageService.updateMessage(messageId, updateData)`
- **Purpose**: Edit existing message
- **Parameters**: `messageId`, `updateData`
- **Returns**: `MessageResponse`
- **Features**: Content update, metadata modification

#### `messageService.deleteMessage(messageId)`
- **Purpose**: Delete message from chat
- **Parameters**: `messageId`
- **Returns**: `SuccessResponse`
- **Features**: Soft delete, permission checking

## Real-Time Integration

### WebSocket Events

#### Message Events
```typescript
// Outgoing events (client → server)
'send_message' → {
  chatId: string;
  userId: string;
  message: string;
  messageType: string;
  receivers: string[];
  metadata?: any;
}

// Incoming events (server → client)
'receive_message' → MessageData
'message_delivered' → { messageId: string, chatId: string }
'message_read' → { messageId: string, readBy: string }
'message_updated' → MessageData
'message_deleted' → { messageId: string, chatId: string }
```

#### Chat Events
```typescript
// Chat room management
'join_chat' → { chatId: string, userId: string }
'leave_chat' → { chatId: string, userId: string }
'user_joined' → { userId: string, chatId: string, userInfo: UserInfo }
'user_left' → { userId: string, chatId: string }

// Chat updates
'chat_created' → ChatData
'chat_updated' → ChatData
'chat_deleted' → { chatId: string }
'chat_list_updated' → { updates: ChatUpdate[] }
```

#### Typing Indicators
```typescript
// Typing events
'typing' → { chatId: string, userId: string, isTyping: boolean }
'stopped_typing' → { chatId: string, userId: string }
'typing_update' → {
  chatId: string;
  typingUsers: Array<{
    userId: string;
    userInfo: { name: string };
    startedAt: string;
  }>;
}
```

### Optimistic UI Updates

#### Message Sending
```typescript
const sendMessage = async (content: string) => {
  // 1. Create optimistic message
  const optimisticMessage = {
    _id: `temp_${Date.now()}`,
    content,
    timestamp: new Date().toISOString(),
    state: MessageState.SENDING
  };
  
  // 2. Update UI immediately
  setMessages(prev => [optimisticMessage, ...prev]);
  
  try {
    // 3. Send via WebSocket
    socketService.sendMessage(chatId, content);
    
    // 4. Update state to sent
    setMessages(prev => prev.map(msg => 
      msg._id === optimisticMessage._id 
        ? { ...msg, state: MessageState.SENT }
        : msg
    ));
  } catch (error) {
    // 5. Handle failure
    setMessages(prev => prev.map(msg => 
      msg._id === optimisticMessage._id 
        ? { ...msg, state: MessageState.FAILED }
        : msg
    ));
  }
};
```

#### Message Editing
```typescript
const editMessage = async (messageId: string, newContent: string) => {
  // 1. Update local state immediately
  setMessages(prev => prev.map(msg => 
    msg._id === messageId 
      ? { ...msg, content: newContent, isEditing: false }
      : msg
  ));
  
  try {
    // 2. Send update to server
    await messageService.updateMessage(messageId, { content: newContent });
    
    // 3. Emit via WebSocket for real-time update
    socketService.emit('message_updated', { messageId, content: newContent });
  } catch (error) {
    // 4. Revert on failure
    setMessages(prev => prev.map(msg => 
      msg._id === messageId 
        ? { ...msg, content: originalContent, isEditing: true }
        : msg
    ));
  }
};
```

## Chat Components

### DMChat Component
**Location**: `src/features/connect/components/DMChat.tsx`

#### Features
- **Real-time messaging** with WebSocket integration
- **Message editing** with inline form
- **Typing indicators** for user experience
- **Message status** tracking (sending, sent, delivered, read)
- **File attachments** support
- **Emoji reactions** and responses

#### State Management
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
const [isTyping, setIsTyping] = useState(false);
const [typingUsers, setTypingUsers] = useState<string[]>([]);
```

#### Key Methods
- **`sendMessage`**: Send new message with optimistic UI
- **`editMessage`**: Edit existing message
- **`deleteMessage`**: Remove message from chat
- **`handleTyping`**: Manage typing indicators
- **`loadMessages`**: Fetch chat history

### Messages List Component
**Location**: `src/features/connect/messages.tsx`

#### Features
- **Chat list** with recent conversations
- **Search functionality** for finding chats
- **Unread message** indicators
- **Last message** preview
- **Chat creation** and management

#### Chat Management
- **Create new chat** with user selection
- **Archive/unarchive** conversations
- **Delete chat** with confirmation
- **Chat settings** and preferences

## Performance Optimization

### Message Loading
- **Pagination**: Load messages in chunks (20-50 per page)
- **Virtual scrolling**: For large chat histories
- **Lazy loading**: Load older messages on demand
- **Caching**: Store recent messages in memory

### Real-Time Updates
- **Event debouncing**: Prevent rapid UI updates
- **Batch processing**: Group multiple updates
- **Priority queuing**: Handle high-priority events first
- **Connection pooling**: Manage multiple chat rooms

### Memory Management
- **Message limits**: Cap stored message count
- **Cleanup routines**: Remove old messages from memory
- **Garbage collection**: Clear unused chat data
- **Storage optimization**: Compress message content

## Error Handling

### Network Failures
```typescript
const handleNetworkError = (error: Error) => {
  if (error.message.includes('network')) {
    // Show offline indicator
    setConnectionStatus('offline');
    
    // Queue message for later
    queueMessage(message);
    
    // Attempt reconnection
    reconnectWithBackoff();
  }
};
```

### Message Failures
```typescript
const handleMessageError = (messageId: string, error: Error) => {
  // Update message state to failed
  setMessages(prev => prev.map(msg => 
    msg._id === messageId 
      ? { ...msg, state: MessageState.FAILED, error: error.message }
      : msg
  ));
  
  // Show retry option
  showRetryButton(messageId);
};
```

### Recovery Strategies
- **Automatic retry**: Retry failed messages
- **Offline queuing**: Store messages when offline
- **State synchronization**: Sync with server on reconnect
- **Conflict resolution**: Handle concurrent edits

## Security and Privacy

### Message Encryption
- **End-to-end encryption** for sensitive chats
- **Message signing** to prevent tampering
- **Secure key exchange** for encryption
- **Forward secrecy** for long-term security

### Access Control
- **Chat membership** verification
- **Permission checking** for actions
- **Rate limiting** to prevent abuse
- **Content filtering** for inappropriate content

### Data Privacy
- **Message retention** policies
- **User consent** for data collection
- **GDPR compliance** for EU users
- **Data anonymization** for analytics

## Monitoring and Analytics

### Performance Metrics
- **Message delivery time** tracking
- **Typing indicator latency** measurement
- **Chat load time** monitoring
- **Memory usage** tracking

### User Analytics
- **Message frequency** analysis
- **Chat engagement** metrics
- **Feature usage** statistics
- **Error rate** monitoring

### Debug Information
```typescript
// Enable debug mode
localStorage.setItem('chat_debug', 'true');

// Log all message events
if (localStorage.getItem('chat_debug') === 'true') {
  console.log('💬 [Chat] Message event:', eventName, data);
}
```

## Troubleshooting

### Common Issues

#### Issue: Messages not sending
**Symptoms**: Messages appear locally but not delivered
**Causes**:
- WebSocket not connected
- User not authenticated
- Chat room not joined
- Server validation errors

**Solutions**:
1. Check WebSocket connection status
2. Verify user authentication
3. Ensure chat room membership
4. Review server logs

#### Issue: Messages not updating in real-time
**Symptoms**: Changes only visible after refresh
**Causes**:
- WebSocket events not handled
- Event handlers not registered
- Component not listening to events
- State update logic errors

**Solutions**:
1. Verify WebSocket event registration
2. Check event handler implementation
3. Ensure component state updates
4. Debug event flow

#### Issue: High memory usage
**Symptoms**: Browser becomes slow, memory warnings
**Causes**:
- Messages not cleaned up
- Event listeners not removed
- Large message history
- Memory leaks in components

**Solutions**:
1. Implement message cleanup
2. Remove event listeners on unmount
3. Limit stored message count
4. Use memory profiling tools

### Debug Checklist
- [ ] Check WebSocket connection status
- [ ] Verify event handler registration
- [ ] Monitor message state changes
- [ ] Check API response status
- [ ] Review component lifecycle
- [ ] Monitor memory usage
- [ ] Test offline scenarios
- [ ] Verify error handling

## Testing

### Unit Tests
- **Message service methods** functionality
- **WebSocket event handling** logic
- **Component state management** behavior
- **Error handling scenarios** coverage

### Integration Tests
- **End-to-end messaging** flow
- **Real-time updates** verification
- **Offline functionality** testing
- **Multi-user chat** scenarios

### Performance Tests
- **High message volume** handling
- **Multiple concurrent users** support
- **Memory usage** under load
- **Network latency** impact

## Maintenance Tasks

### Daily
- [ ] Monitor message delivery rates
- [ ] Check WebSocket connection health
- [ ] Review error logs
- [ ] Verify real-time functionality

### Weekly
- [ ] Analyze performance metrics
- [ ] Review user feedback
- [ ] Test offline scenarios
- [ ] Update error handling

### Monthly
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Feature enhancement planning
- [ ] Documentation updates

## Future Enhancements

### Planned Features
- **Voice messages** recording and playback
- **Video calls** integration
- **File sharing** with progress tracking
- **Message reactions** and responses
- **Chat bots** and automation

### Technical Improvements
- **Service Worker** for offline support
- **IndexedDB** for message persistence
- **Message compression** for bandwidth
- **Advanced search** functionality
- **Message threading** and replies

## Support and Resources

### Documentation
- **Socket.IO chat guide**: https://socket.io/docs/v4/
- **React chat patterns**: [Internal documentation]
- **MPI chat API**: [API documentation]

### Tools
- **Chat testing tools**: Test messaging flows
- **Performance profilers**: Monitor chat performance
- **Network analyzers**: Debug WebSocket issues
- **Memory profilers**: Track memory usage

### Team Contacts
- **Frontend Team**: Chat UI and components
- **Backend Team**: Chat API and WebSocket server
- **DevOps Team**: Infrastructure and monitoring
- **QA Team**: Testing and validation

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Maintainer**: [Your Name]
