import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '@/config/websocket.config';

export interface UserInfo {
  name?: string;
  avatar?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

export interface MessageData {
  messageId: string;
  chatId: string;
  senderId: string;
  senderInfo: {
    name: string;
    avatar?: string;
  };
  message: string;
  messageType: 'text' | 'image' | 'file' | 'emoji';
  timestamp: string;
  receivers: string[];
  metadata?: {
    replyTo?: string;
    mentions?: string[];
    custom?: any;
  };
}

export interface TypingData {
  chatId: string;
  typingUsers: Array<{
    userId: string;
    userInfo: {
      name: string;
    };
    startedAt: string;
  }>;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private userId: string | null = null;
  private userInfo: UserInfo | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    // Initialize socket connection
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      // Connect to the chat server using configuration
      this.socket = io(WEBSOCKET_CONFIG.URL, {
        transports: ['websocket'],
        autoConnect: false,
        timeout: 20000,
      });

      this.setupEventHandlers();
    } catch (error) {
      // Silent fail for initialization errors
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.emit('socket_connected', { socketId: this.socket?.id });
      
      // Setup user if we have user data
      if (this.userId && this.userInfo) {
        this.setupUser(this.userId, this.userInfo);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.emit('socket_disconnected', { reason });
    });

    // Message events
    this.socket.on('receive_message', (data: MessageData) => {
      this.emit('receive_message', data);
    });

    this.socket.on('message_delivered', (data) => {
      this.emit('message_delivered', data);
    });

    this.socket.on('queued_messages', (data) => {
      this.emit('queued_messages', data);
    });

    // Typing events
    this.socket.on('typing_update', (data: TypingData) => {
      this.emit('typing_update', data);
    });

    // Chat events
    this.socket.on('user_joined', (data) => {
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data) => {
      this.emit('user_left', data);
    });

    this.socket.on('chat_list_updated', (data) => {
      this.emit('chat_list_updated', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      this.emit('socket_error', error);
    });

    this.socket.on('validation_error', (error) => {
      this.emit('socket_validation_error', error);
    });

    this.socket.on('rate_limit_exceeded', (error) => {
      this.emit('socket_rate_limit_exceeded', error);
    });
  }

  // Connect to the server
  connect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // Setup user profile
  setupUser(userId: string, userInfo: UserInfo) {
    this.userId = userId;
    this.userInfo = userInfo;

    if (this.socket && this.isConnected) {
      this.socket.emit('setup', { userId, userInfo });
    }
  }

  // Join a chat room
  joinChat(chatId: string) {
    if (this.socket && this.isConnected && this.userId) {
      this.socket.emit('join_chat', { chatId, userId: this.userId });
    }
  }

  // Leave a chat room
  leaveChat(chatId: string) {
    if (this.socket && this.isConnected && this.userId) {
      this.socket.emit('leave_chat', { chatId, userId: this.userId });
    }
  }

  // Send a message
  sendMessage(chatId: string, message: string, receivers?: string[], metadata?: any) {
    if (this.socket && this.isConnected && this.userId) {
      this.socket.emit('send_message', {
        chatId,
        userId: this.userId,
        message,
        messageType: 'text',
        receivers,
        metadata
      });
    }
  }

  // Start typing indicator
  startTyping(chatId: string) {
    if (this.socket && this.isConnected && this.userId) {
      this.socket.emit('typing', {
        chatId,
        userId: this.userId,
        isTyping: true
      });
    }
  }

  // Stop typing indicator
  stopTyping(chatId: string) {
    if (this.socket && this.isConnected && this.userId) {
      this.socket.emit('stopped_typing', {
        chatId,
        userId: this.userId
      });
    }
  }

  // Update chat list (mark as read, update last seen)
  updateChatList(chatId: string, action: 'mark_read' | 'update_last_seen', senders?: string[]) {
    if (this.socket && this.isConnected && this.userId) {
      this.socket.emit('update_chat_list', {
        chatId,
        userId: this.userId,
        action,
        senders
      });
    }
  }

  // Event handling
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler?: Function) {
    if (!this.eventHandlers.has(event)) return;
    
    if (handler) {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.delete(event);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      userId: this.userId
    };
  }

  // Check if socket is ready
  isReady() {
    return this.socket && this.isConnected && this.userId;
  }
}

// Create a singleton instance
export const socketService = new SocketService();

// Export the class for testing
export { SocketService };
