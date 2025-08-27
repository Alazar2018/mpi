import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from '@/config/api.config';

// Base URL for messages API
const MESSAGE_BASE_URL = `${API_CONFIG.BASE_URL}/api/v1/messages`;

// Message interfaces based on the API documentation
export interface MessageSender {
  _id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  avatar?: string;
}

export interface MessageChat {
  _id: string;
  users: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface Message {
  _id: string;
  content: string;
  sender: MessageSender;
  chat: string | MessageChat;
  receivers: string[];
  isRead: boolean;
  image?: string;
  readBy?: string[];
  isGroup?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageListResponse {
  messages: Message[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalMessages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateMessageRequest {
  content: string;
  chatId: string;
  timezone?: string;
  clientTimestamp?: string;
}

export interface CreateMessageWithImageRequest {
  content: string;
  chatId: string;
  timezone?: string;
  clientTimestamp?: string;
  image: File;
}

export interface UpdateMessageRequest {
  content?: string;
  isRead?: boolean;
}

export interface GetMessagesParams {
  chatId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

/**
 * MessageService class for handling all message-related API operations
 */
class MessageService {
  /**
   * Get all messages for a chat with pagination
   * GET /api/v1/messages
   */
  async getMessages(params: GetMessagesParams = {}): Promise<MessageListResponse> {
    try {
      const { chatId, page = 1, limit = 10, sort = '-createdAt' } = params;
      
      if (!chatId) {
        throw new Error('Chat ID is required');
      }

      const queryParams = new URLSearchParams({
        chatId,
        page: page.toString(),
        limit: Math.min(limit, 50).toString(), // Max limit is 50
        sort
      });

      const response = await axiosInstance.get<MessageListResponse>(`${MESSAGE_BASE_URL}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getMessages:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Get messages for a specific chat using chat ID as parameter
   * GET /api/v1/messages/:id
   */
  async getMessagesByChatId(chatId: string, page: number = 1, limit: number = 12): Promise<MessageListResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(limit, 50).toString() // Max limit is 50
      });

      const response = await axiosInstance.get<MessageListResponse>(`${MESSAGE_BASE_URL}/${chatId}?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getMessagesByChatId:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to fetch messages for chat');
    }
  }

  /**
   * Create a new text message
   * POST /api/v1/messages
   */
  async createMessage(messageData: CreateMessageRequest): Promise<Message> {
    try {
      const response = await axiosInstance.post<Message>(MESSAGE_BASE_URL, messageData);
      return response.data;
    } catch (error: any) {
      console.error('Error in createMessage:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to create message');
    }
  }

  /**
   * Create a new message with image attachment
   * POST /api/v1/messages (multipart/form-data)
   */
  async createMessageWithImage(messageData: CreateMessageWithImageRequest): Promise<Message> {
    try {
      const formData = new FormData();
      formData.append('content', messageData.content);
      formData.append('chatId', messageData.chatId);
      
      if (messageData.timezone) {
        formData.append('timezone', messageData.timezone);
      }
      
      if (messageData.clientTimestamp) {
        formData.append('clientTimestamp', messageData.clientTimestamp);
      }
      
      formData.append('image', messageData.image);

      const response = await axiosInstance.post<Message>(MESSAGE_BASE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error in createMessageWithImage:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to create message');
    }
  }

  /**
   * Update a message (sender only)
   * PATCH /api/v1/messages/:id
   */
  async updateMessage(messageId: string, updateData: UpdateMessageRequest): Promise<Message> {
    try {
      const response = await axiosInstance.patch<Message>(`${MESSAGE_BASE_URL}/${messageId}`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateMessage:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to update message');
    }
  }

  /**
   * Mark a message as read
   * PATCH /api/v1/messages/read/:id
   */
  async markMessageAsRead(messageId: string): Promise<Message> {
    try {
      const response = await axiosInstance.patch<Message>(`${MESSAGE_BASE_URL}/read/${messageId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in markMessageAsRead:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to mark message as read');
    }
  }

  /**
   * Delete a message (sender only)
   * DELETE /api/v1/messages/:id
   */
  async deleteMessage(messageId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<{ message: string }>(`${MESSAGE_BASE_URL}/${messageId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in deleteMessage:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Mark multiple messages as read for a chat
   * Utility method for marking all messages in a chat as read
   */
  async markChatMessagesAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      // Mark each message as read
      const promises = messageIds.map(messageId => this.markMessageAsRead(messageId));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error in markChatMessagesAsRead:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for a chat
   * Utility method for getting unread messages
   */
  async getUnreadMessageCount(chatId: string): Promise<number> {
    try {
      const response = await this.getMessages({ chatId, limit: 1000 }); // Get all messages to count unread
      const unreadCount = response.messages.filter(message => !message.isRead).length;
      return unreadCount;
    } catch (error) {
      console.error('Error in getUnreadMessageCount:', error);
      return 0;
    }
  }

  /**
   * Send a message to a group chat
   * Utility method for group messaging
   */
  async sendGroupMessage(chatId: string, content: string, image?: File): Promise<Message> {
    try {
      if (image) {
        const response = await this.createMessageWithImage({
          content,
          chatId,
          image
        });
        return response;
      } else {
        const response = await this.createMessage({
          content,
          chatId
        });
        return response;
      }
    } catch (error) {
      console.error('Error in sendGroupMessage:', error);
      throw error;
    }
  }

  /**
   * Send a direct message
   * Utility method for direct messaging
   */
  async sendDirectMessage(chatId: string, content: string, image?: File): Promise<Message> {
    try {
      if (image) {
        const response = await this.createMessageWithImage({
          content,
          chatId,
          image
        });
        return response;
      } else {
        const response = await this.createMessage({
          content,
          chatId
        });
        return response;
      }
    } catch (error) {
      console.error('Error in sendDirectMessage:', error);
      throw error;
    }
  }
}

// Create and export instance
export const messageService = new MessageService();
