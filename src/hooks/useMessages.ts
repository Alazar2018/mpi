import { useState, useEffect, useCallback, useRef } from 'react';
import { messageService, type Message, type MessageListResponse } from '@/service/message.server';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';

export interface UseMessagesOptions {
  chatId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialPage?: number;
  initialLimit?: number;
  onMessageSent?: (message: Message) => void;
}

export interface UseMessagesReturn {
  // State
  messages: Message[];
  loading: boolean;
  error: string | null;
  pagination: MessageListResponse['pagination'] | null;
  hasMore: boolean;
  
  // Actions
  loadMessages: (page?: number, limit?: number) => Promise<void>;
  sendMessage: (content: string, image?: File) => Promise<Message | null>;
  updateMessage: (messageId: string, content: string) => Promise<Message | null>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markAllMessagesAsRead: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  
  // Utility methods
  formatMessageTime: (timestamp: string) => string;
  isMessageFromCurrentUser: (message: Message) => boolean;
  getUnreadCount: () => number;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { chatId, onMessageSent } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<MessageListResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuthStore();
  
  // Check if there are more messages to load
  const hasMoreMessages = pagination ? pagination.hasNextPage : false;

  // Load messages for the current chat
  const loadMessages = useCallback(async (page: number = 1, limit: number = currentLimit) => {
    if (!chatId || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.getMessages({
        chatId,
        page,
        limit
      });
      
      if (page === 1) {
        // First page - replace messages
        setMessages(response.messages || []);
      } else {
        // Subsequent pages - append messages
        setMessages(prev => [...(response.messages || []), ...prev]);
      }
      
      setPagination(response.pagination || null);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId, user, currentLimit]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, image?: File): Promise<Message | null> => {
    if (!chatId || !user || !content.trim()) return null;
    
    try {
      setError(null);
      
      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        _id: `temp_${Date.now()}`,
        content: content.trim(),
        sender: {
          _id: user._id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          emailAddress: typeof user.emailAddress === 'string' ? user.emailAddress : '',
          avatar: user.avatar
        },
        chat: chatId,
        receivers: [],
        isRead: true,
        image: image ? URL.createObjectURL(image) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add optimistic message to UI immediately
      setMessages(prev => [optimisticMessage, ...prev]);
      
      // Send via HTTP API for persistence
      const getTimezone = () => {
        const offset = new Date().getTimezoneOffset();
        const hours = Math.abs(Math.floor(offset / 60));
        const minutes = Math.abs(offset % 60);
        const sign = offset <= 0 ? '+' : '-';
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };
      
      let newMessage: Message;
      
      if (image) {
        const response = await messageService.createMessageWithImage({
          content: content.trim(),
          chatId,
          image,
          timezone: getTimezone(),
          clientTimestamp: new Date().toISOString()
        });
        newMessage = response;
      } else {
        const response = await messageService.createMessage({
          content: content.trim(),
          chatId,
          timezone: getTimezone(),
          clientTimestamp: new Date().toISOString()
        });
        newMessage = response;
      }
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg._id === optimisticMessage._id ? newMessage : msg
      ));
      
      // Notify parent component that message was sent
      if (onMessageSent) {
        onMessageSent(newMessage);
      }
      
      return newMessage;
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp_')));
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error sending message:', err);
      return null;
    }
  }, [chatId, user, onMessageSent]);

  // Update an existing message
  const updateMessage = useCallback(async (messageId: string, content: string): Promise<Message | null> => {
    if (!content.trim()) return null;
    
    try {
      setError(null);
      
      const updatedMessage = await messageService.updateMessage(messageId, { content: content.trim() });
      
      // Update the message in the local state
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, content: content.trim(), updatedAt: updatedMessage.updatedAt } : msg
      ));
      
      toast.success('Message updated successfully!');
      return updatedMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update message';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating message:', err);
      return null;
    }
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      setError(null);
      
      await messageService.deleteMessage(messageId);
      
      // Remove the message from local state
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
      toast.success('Message deleted successfully!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error deleting message:', err);
      return false;
    }
  }, []);

  // Mark a message as read
  const markMessageAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      await messageService.markMessageAsRead(messageId);
      
      // Update the message in local state
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Mark all messages in the chat as read
  const markAllMessagesAsRead = useCallback(async (): Promise<void> => {
    if (!chatId) return;
    
    try {
      const unreadMessages = messages.filter(msg => !msg.isRead && !isMessageFromCurrentUser(msg));
      const messageIds = unreadMessages.map(msg => msg._id);
      
      if (messageIds.length > 0) {
        await messageService.markChatMessagesAsRead(chatId, messageIds);
        
        // Update all messages as read in local state
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all messages as read:', err);
    }
  }, [chatId, messages]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (hasMoreMessages && !loading) {
      await loadMessages(currentPage + 1);
    }
  }, [hasMoreMessages, loading, currentPage, loadMessages]);

  // Utility methods
  const formatMessageTime = useCallback((timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  const isMessageFromCurrentUser = useCallback((message: Message): boolean => {
    return message.sender._id === user?._id;
  }, [user?._id]);

  const getUnreadCount = useCallback((): number => {
    return messages.filter(msg => !msg.isRead && !isMessageFromCurrentUser(msg)).length;
  }, [messages, isMessageFromCurrentUser]);

  // Load messages on mount and when chatId changes
  useEffect(() => {
    if (chatId && user) {
      loadMessages(1);
    }
  }, [chatId, user, loadMessages]);

  // Note: Socket integration is now handled in the main ChatSocketProvider
  // This hook focuses on message management and API calls

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (chatId && messages.length > 0) {
      markAllMessagesAsRead();
    }
  }, [chatId, messages.length, markAllMessagesAsRead]);

  return {
    messages,
    loading,
    error,
    pagination,
    hasMore: hasMoreMessages,
    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    markMessageAsRead,
    markAllMessagesAsRead,
    loadMoreMessages,
    formatMessageTime,
    isMessageFromCurrentUser,
    getUnreadCount
  };
}
