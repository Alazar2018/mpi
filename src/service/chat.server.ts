import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from "@/config/api.config";

// Chat API Base URL - use the proper configuration
const CHAT_BASE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHATS.BASE}`;

// Types for Chat module based on API response
export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  emailAddress: {
    email: string;
    verified: boolean;
  };
  gender: string;
  phoneNumber: {
    countryCode: string;
    number: string;
  };
  address: {
    streetAddress: string;
    streetAddress2?: string;
    city: string;
    stateProvince: string;
    country: string;
    zipCode?: string;
  };
  avatar?: string;
  role: string;
  __t: string; // Type discriminator
}

export interface GroupAdmin {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface Chat {
  _id: string;
  chatName?: string; // Only for group chats
  users: ChatUser[];
  isGroupChat: boolean;
  groupAdmin?: GroupAdmin; // Only for group chats
  latestMessage?: string;
  latestMessageContent?: string;
  latestMessageSenderId?: string;
  latestMessageTimeStamp?: string;
  photo?: string;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  mutedUntil?: string; // ISO timestamp when mute expires
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from API response
  id?: string; // Alternative ID field
  userChatId?: string; // User-specific chat ID
  userChatCreatedAt?: string; // User-specific chat creation time
  userChatUpdatedAt?: string; // User-specific chat update time
}

export interface ChatListResponse {
  chats: Chat[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalChats: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totalUnreadCount: number;
  filter: string;
  search: string;
}

export interface CreateDirectChatRequest {
  userId: string;
}

export interface CreateGroupChatRequest {
  userIds: string[];
  chatName: string;
}

export interface UpdateGroupNameRequest {
  chatName: string;
}

export interface AddUsersRequest {
  userIds: string[];
}

export interface RemoveUsersRequest {
  userIds: string[];
}

export interface ArchiveChatRequest {
  archive: boolean;
}

export interface PinChatRequest {
  pin: boolean;
}

export interface MuteChatRequest {
  duration: number; // Duration in hours (0 to unmute)
}

export interface TransferAdminRequest {
  newAdminId: string;
}

export interface ChatStatistics {
  messageCount: number;
  memberCount: number;
  activeMembers: number;
  averageResponseTime: string;
  mostActiveUser: {
    _id: string;
    firstName: string;
    messageCount: number;
  };
}

export interface SearchMessagesRequest {
  q: string;
  page?: number;
  limit?: number;
}

export interface SearchMessagesResponse {
  messages: any[]; // Define message type if needed
  pagination: {
    currentPage: number;
    totalPages: number;
    totalMessages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BulkOperation {
  chatId: string;
  action: 'archive' | 'pin' | 'mute';
  value: boolean | number;
}

export interface BulkOperationsRequest {
  operations: BulkOperation[];
}

// Chat API Service
class ChatService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Get list of chats with pagination and filtering
   * GET /api/v1/chats
   */
  async getChats(params: {
    page?: number;
    limit?: number;
    filter?: 'all' | 'groups' | 'direct' | 'unread';
    search?: string;
  } = {}): Promise<ChatListResponse> {
    try {
      // Build params object, excluding empty search
      const requestParams: any = {
        page: params.page || 1,
        limit: params.limit || 20,
        filter: params.filter || 'all'
      };
      
      // Only add search parameter if it's not empty
      if (params.search && params.search.trim()) {
        requestParams.search = params.search.trim();
      }

      const response = await axiosInstance.get<{status: string; data: ChatListResponse}>(CHAT_BASE_URL, {
        params: requestParams
      });
      
      // Handle the wrapped response structure
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      // Fallback to direct response if structure is different
      return response.data as unknown as ChatListResponse;
    } catch (error) {
      console.error('Error in getChats:', error);
      throw error;
    }
  }

  /**
   * Create or get direct chat with another user
   * POST /api/v1/chats
   */
  async createDirectChat(userId: string): Promise<Chat> {
    try {
      const response = await axiosInstance.post<Chat>(CHAT_BASE_URL, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error in createDirectChat:', error);
      throw error;
    }
  }

  /**
   * Get or create direct chat by user ID
   * GET /api/v1/chats/user/:userId
   */
  async getDirectChatByUserId(userId: string): Promise<Chat> {
    try {
      const response = await axiosInstance.get<Chat>(`${CHAT_BASE_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error in getDirectChatByUserId:', error);
      throw error;
    }
  }

  /**
   * Create a new group chat
   * POST /api/v1/chats/group
   */
  async createGroupChat(userIds: string[], chatName: string): Promise<Chat> {
    try {
      const response = await axiosInstance.post<Chat>(`${CHAT_BASE_URL}/group`, {
        userIds,
        chatName
      });
      return response.data;
    } catch (error) {
      console.error('Error in createGroupChat:', error);
      throw error;
    }
  }

  /**
   * Get group chat details by ID
   * GET /api/v1/chats/group/:chatId
   */
  async getGroupChatById(chatId: string): Promise<Chat> {
    try {
      const response = await axiosInstance.get<Chat>(`${CHAT_BASE_URL}/group/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error in getGroupChatById:', error);
      throw error;
    }
  }

  /**
   * Update group chat name (admin only)
   * PATCH /api/v1/chats/group/:chatId/name
   */
  async updateGroupChatName(chatId: string, chatName: string): Promise<Chat> {
    try {
      const response = await axiosInstance.patch<Chat>(`${CHAT_BASE_URL}/group/${chatId}/name`, {
        chatName
      });
      return response.data;
    } catch (error) {
      console.error('Error in updateGroupChatName:', error);
      throw error;
    }
  }

  /**
   * Update group chat photo (admin only)
   * PATCH /api/v1/chats/group/:chatId/photo
   */
  async updateGroupChatPhoto(chatId: string, imageFile: File): Promise<Chat> {
    try {
      const formData = new FormData();
      formData.append('groupChatPhoto', imageFile);

      const response = await axiosInstance.patch<Chat>(`${CHAT_BASE_URL}/group/${chatId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in updateGroupChatPhoto:', error);
      throw error;
    }
  }

  /**
   * Add users to group chat (admin only)
   * POST /api/v1/chats/group/:chatId/add
   */
  async addUsersToGroup(chatId: string, userIds: string[]): Promise<Chat> {
    try {
      const response = await axiosInstance.post<Chat>(`${CHAT_BASE_URL}/group/${chatId}/add`, {
        userIds
      });
      return response.data;
    } catch (error) {
      console.error('Error in addUsersToGroup:', error);
      throw error;
    }
  }

  /**
   * Remove users from group chat (admin only)
   * DELETE /api/v1/chats/group/:chatId/remove
   */
  async removeUsersFromGroup(chatId: string, userIds: string[]): Promise<Chat> {
    try {
      const response = await axiosInstance.delete<Chat>(`${CHAT_BASE_URL}/group/${chatId}/remove`, {
        data: { userIds }
      });
      return response.data;
    } catch (error) {
      console.error('Error in removeUsersFromGroup:', error);
      throw error;
    }
  }

  /**
   * Leave group chat (members only, not admin)
   * DELETE /api/v1/chats/group/:chatId/leave
   */
  async leaveGroupChat(chatId: string): Promise<void> {
    try {
      await axiosInstance.delete(`${CHAT_BASE_URL}/group/${chatId}/leave`);
    } catch (error) {
      console.error('Error in leaveGroupChat:', error);
      throw error;
    }
  }

  /**
   * Delete group chat (admin only)
   * DELETE /api/v1/chats/group/:chatId
   */
  async deleteGroupChat(chatId: string): Promise<void> {
    try {
      await axiosInstance.delete(`${CHAT_BASE_URL}/group/${chatId}`);
    } catch (error) {
      console.error('Error in deleteGroupChat:', error);
      throw error;
    }
  }

  /**
   * Get total unread count across all chats
   * GET /api/v1/chats/totalUnreadCount
   */
  async getTotalUnreadCount(): Promise<{ totalUnreadCount: number }> {
    try {
      const response = await axiosInstance.get<{ totalUnreadCount: number }>(`${CHAT_BASE_URL}/totalUnreadCount`);
      return response.data;
    } catch (error) {
      console.error('Error in getTotalUnreadCount:', error);
      throw error;
    }
  }

  /**
   * Archive or unarchive a chat
   * PATCH /api/v1/chats/:chatId/archive
   */
  async archiveChat(chatId: string, archive: boolean): Promise<Chat> {
    try {
      const response = await axiosInstance.patch<Chat>(`${CHAT_BASE_URL}/${chatId}/archive`, {
        archive
      });
      return response.data;
    } catch (error) {
      console.error('Error in archiveChat:', error);
      throw error;
    }
  }

  /**
   * Pin or unpin a chat
   * PATCH /api/v1/chats/:chatId/pin
   */
  async pinChat(chatId: string, pin: boolean): Promise<Chat> {
    try {
      const response = await axiosInstance.patch<Chat>(`${CHAT_BASE_URL}/${chatId}/pin`, {
        pin
      });
      return response.data;
    } catch (error) {
      console.error('Error in pinChat:', error);
      throw error;
    }
  }

  /**
   * Mark chat as read
   * PATCH /api/v1/chats/:chatId/mark-read
   */
  async markChatAsRead(chatId: string): Promise<Chat> {
    try {
      const response = await axiosInstance.patch<Chat>(`${CHAT_BASE_URL}/${chatId}/mark-read`);
      return response.data;
    } catch (error) {
      console.error('Error in markChatAsRead:', error);
      throw error;
    }
  }

  /**
   * Mute or unmute a chat
   * PATCH /api/v1/chats/:id/mute
   */
  async muteChat(chatId: string, duration: number): Promise<Chat> {
    try {
      const response = await axiosInstance.patch<Chat>(
        `${CHAT_BASE_URL}/${chatId}/mute`,
        { duration }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to mute/unmute chat');
    }
  }

  /**
   * Transfer group admin rights
   * PATCH /api/v1/chats/group/:chatId/transfer-admin
   */
  async transferGroupAdmin(chatId: string, newAdminId: string): Promise<Chat> {
    try {
      const response = await axiosInstance.patch<Chat>(`${CHAT_BASE_URL}/group/${chatId}/transfer-admin`, {
        newAdminId
      });
      return response.data;
    } catch (error) {
      console.error('Error in transferGroupAdmin:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics (admin only)
   * GET /api/v1/chats/:chatId/statistics
   */
  async getChatStatistics(chatId: string): Promise<ChatStatistics> {
    try {
      const response = await axiosInstance.get<ChatStatistics>(`${CHAT_BASE_URL}/${chatId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error in getChatStatistics:', error);
      throw error;
    }
  }

  /**
   * Search messages within a chat
   * GET /api/v1/chats/:chatId/search
   */
  async searchChatMessages(chatId: string, query: string, page: number = 1, limit: number = 20): Promise<SearchMessagesResponse> {
    try {
      const response = await axiosInstance.get<SearchMessagesResponse>(`${CHAT_BASE_URL}/${chatId}/search`, {
        params: { q: query, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error in searchChatMessages:', error);
      throw error;
    }
  }

  /**
   * Perform bulk operations on multiple chats
   * POST /api/v1/chats/bulk-operations
   */
  async bulkChatOperations(operations: BulkOperation[]): Promise<void> {
    try {
      await axiosInstance.post(`${CHAT_BASE_URL}/bulk-operations`, {
        operations
      });
    } catch (error) {
      console.error('Error in bulkChatOperations:', error);
      throw error;
    }
  }

  /**
   * Get chat by ID (generic method)
   */
  async getChatById(chatId: string): Promise<Chat> {
    try {
      const response = await axiosInstance.get<Chat>(`${CHAT_BASE_URL}/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error in getChatById:', error);
      throw error;
    }
  }

  /**
   * Get chats by filter type
   */
  async getChatsByFilter(filter: 'all' | 'groups' | 'direct' | 'unread'): Promise<ChatListResponse> {
    return this.getChats({ filter });
  }

  /**
   * Search chats by name
   */
  async searchChats(searchTerm: string): Promise<ChatListResponse> {
    // Only search if searchTerm is not empty
    if (!searchTerm || !searchTerm.trim()) {
      // If no search term, just get all chats without search parameter
      return this.getChats();
    }
    
    try {
      const response = await axiosInstance.get<{status: string; data: ChatListResponse}>(`${CHAT_BASE_URL}?search=${encodeURIComponent(searchTerm.trim())}`);
      
      // Handle the wrapped response structure
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      // Fallback to direct response if structure is different
      return response.data as unknown as ChatListResponse;
    } catch (error) {
      console.error('Error in searchChats:', error);
      throw error;
    }
  }

  /**
   * Get unread chats only
   */
  async getUnreadChats(): Promise<ChatListResponse> {
    return this.getChats({ filter: 'unread' });
  }

  /**
   * Get group chats only
   */
  async getGroupChats(): Promise<ChatListResponse> {
    return this.getChats({ filter: 'groups' });
  }

  /**
   * Get direct chats only
   */
  async getDirectChats(): Promise<ChatListResponse> {
    return this.getChats({ filter: 'direct' });
  }

  /**
   * Helper method to check if user is admin of a group
   */
  isUserGroupAdmin(chat: Chat, userId: string): boolean {
    if (!chat.isGroupChat || !chat.groupAdmin) return false;
    return chat.groupAdmin._id === userId;
  }

  /**
   * Helper method to get other users in direct chat
   */
  getOtherUsersInDirectChat(chat: Chat, currentUserId: string): ChatUser[] {
    if (chat.isGroupChat) return [];
    return chat.users.filter(user => user._id !== currentUserId);
  }

  /**
   * Helper method to format last message time
   */
  formatLastMessageTime(timestamp: string): string {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return messageTime.toLocaleDateString();
  }

  /**
   * Helper method to get chat display name
   */
  getChatDisplayName(chat: Chat, currentUserId: string): string {
    if (chat.isGroupChat) {
      return chat.chatName || 'Group Chat';
    } else {
      const otherUsers = this.getOtherUsersInDirectChat(chat, currentUserId);
      if (otherUsers.length === 1) {
        return `${otherUsers[0].firstName} ${otherUsers[0].lastName}`;
      }
      return 'Direct Chat';
    }
  }
}

// Create and export instance
export const chatService = new ChatService();
