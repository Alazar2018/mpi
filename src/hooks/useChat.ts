import { useState, useEffect, useCallback } from 'react';
import { chatService, type Chat, type ChatListResponse } from '@/service/chat.server';
import { useAuthStore } from '@/store/auth.store';

export interface UseChatOptions {
  initialFilter?: 'all' | 'groups' | 'direct' | 'unread';
  initialPage?: number;
  initialLimit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseChatReturn {
  // State
  chats: Chat[];
  selectedChat: Chat | null;
  loading: boolean;
  error: string | null;
  pagination: ChatListResponse['pagination'] | null;
  totalUnreadCount: number;
  
  // Actions
  loadChats: (filter?: 'all' | 'groups' | 'direct' | 'unread', page?: number, limit?: number) => Promise<void>;
  selectChat: (chat: Chat | null) => void;
  createDirectChat: (userId: string) => Promise<Chat>;
  createGroupChat: (userIds: string[], chatName: string) => Promise<Chat>;
  updateGroupName: (chatId: string, chatName: string) => Promise<Chat>;
  updateGroupPhoto: (chatId: string, imageFile: File) => Promise<Chat>;
  addUsersToGroup: (chatId: string, userIds: string[]) => Promise<Chat>;
  removeUsersFromGroup: (chatId: string, userIds: string[]) => Promise<Chat>;
  leaveGroup: (chatId: string) => Promise<void>;
  deleteGroup: (chatId: string) => Promise<void>;
  archiveChat: (chatId: string, archive: boolean) => Promise<Chat>;
  pinChat: (chatId: string, pin: boolean) => Promise<Chat>;
  markChatAsRead: (chatId: string) => Promise<Chat>;
  muteChat: (chatId: string, duration: number) => Promise<Chat>;
  transferAdmin: (chatId: string, newAdminId: string) => Promise<Chat>;
  searchChats: (query: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  
  // Utility methods
  isUserGroupAdmin: (chat: Chat) => boolean;
  getChatDisplayName: (chat: Chat) => string;
  formatLastMessageTime: (timestamp: string) => string;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    initialFilter = 'all',
    initialPage = 1,
    initialLimit = 20,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ChatListResponse['pagination'] | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [currentFilter, setCurrentFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);

  const { user } = useAuthStore();

  // Load chats with current filter and pagination
  const loadChats = useCallback(async (
    filter: 'all' | 'groups' | 'direct' | 'unread' = currentFilter,
    page: number = currentPage,
    limit: number = currentLimit
  ) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await chatService.getChats({ filter, page, limit });
      
      setChats(response.chats || []);
      setPagination(response.pagination || null);
      setTotalUnreadCount(response.totalUnreadCount || 0);
      setCurrentFilter(filter);
      setCurrentPage(page);
      setCurrentLimit(limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, currentPage, currentLimit]);

  // Load chats on mount and when user changes
  useEffect(() => {
    if (user) {
      loadChats(initialFilter);
    }
  }, [user, loadChats, initialFilter]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      loadChats(currentFilter);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, loadChats, currentFilter]);

  // Create direct chat
  const createDirectChat = useCallback(async (userId: string): Promise<Chat> => {
    try {
      const chat = await chatService.createDirectChat(userId);
      // Add to local state if not already present
      if (!chats.find(c => c._id === chat._id)) {
        setChats(prev => [chat, ...prev]);
      }
      return chat;
    } catch (err) {
      throw err;
    }
  }, [chats]);

  // Create group chat
  const createGroupChat = useCallback(async (userIds: string[], chatName: string): Promise<Chat> => {
    try {
      const chat = await chatService.createGroupChat(userIds, chatName);
      // Add to local state
      setChats(prev => [chat, ...prev]);
      return chat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Update group name
  const updateGroupName = useCallback(async (chatId: string, chatName: string): Promise<Chat> => {
    try {
      const updatedChat = await chatService.updateGroupChatName(chatId, chatName);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, chatName: updatedChat.chatName } : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Update group photo
  const updateGroupPhoto = useCallback(async (chatId: string, imageFile: File): Promise<Chat> => {
    try {
      const updatedChat = await chatService.updateGroupChatPhoto(chatId, imageFile);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, photo: updatedChat.photo } : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Add users to group
  const addUsersToGroup = useCallback(async (chatId: string, userIds: string[]): Promise<Chat> => {
    try {
      const updatedChat = await chatService.addUsersToGroup(chatId, userIds);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? updatedChat : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Remove users from group
  const removeUsersFromGroup = useCallback(async (chatId: string, userIds: string[]): Promise<Chat> => {
    try {
      const updatedChat = await chatService.removeUsersFromGroup(chatId, userIds);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? updatedChat : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Leave group
  const leaveGroup = useCallback(async (chatId: string): Promise<void> => {
    try {
      await chatService.leaveGroupChat(chatId);
      // Remove from local state
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
      }
    } catch (err) {
      throw err;
    }
  }, [selectedChat]);

  // Delete group
  const deleteGroup = useCallback(async (chatId: string): Promise<void> => {
    try {
      await chatService.deleteGroupChat(chatId);
      // Remove from local state
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
      }
    } catch (err) {
      throw err;
    }
  }, [selectedChat]);

  // Archive chat
  const archiveChat = useCallback(async (chatId: string, archive: boolean): Promise<Chat> => {
    try {
      const updatedChat = await chatService.archiveChat(chatId, archive);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, isArchived: updatedChat.isArchived } : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Pin chat
  const pinChat = useCallback(async (chatId: string, pin: boolean): Promise<Chat> => {
    try {
      const updatedChat = await chatService.pinChat(chatId, pin);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, isPinned: updatedChat.isPinned } : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Mark chat as read
  const markChatAsRead = useCallback(async (chatId: string): Promise<Chat> => {
    try {
      const updatedChat = await chatService.markChatAsRead(chatId);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, unreadCount: 0, lastReadAt: updatedChat.lastReadAt } : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Mute chat
  const muteChat = useCallback(async (chatId: string, duration: number): Promise<Chat> => {
    try {
      const updatedChat = await chatService.muteChat(chatId, duration);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, isMuted: updatedChat.isMuted } : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Transfer admin
  const transferAdmin = useCallback(async (chatId: string, newAdminId: string): Promise<Chat> => {
    try {
      const updatedChat = await chatService.transferGroupAdmin(chatId, newAdminId);
      // Update in local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? updatedChat : chat
      ));
      return updatedChat;
    } catch (err) {
      throw err;
    }
  }, []);

  // Search chats
  const searchChats = useCallback(async (query: string): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await chatService.searchChats(query);
      
      setChats(response.chats || []);
      setPagination(response.pagination || null);
      setTotalUnreadCount(response.totalUnreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search chats');
      console.error('Error searching chats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      const response = await chatService.getTotalUnreadCount();
      setTotalUnreadCount(response.totalUnreadCount);
    } catch (err) {
      console.error('Error refreshing unread count:', err);
    }
  }, [user]);

  // Utility methods
  const isUserGroupAdmin = useCallback((chat: Chat): boolean => {
    if (!user) return false;
    return chatService.isUserGroupAdmin(chat, user._id);
  }, [user]);

  const getChatDisplayName = useCallback((chat: Chat): string => {
    if (!user) return 'Chat';
    return chatService.getChatDisplayName(chat, user._id);
  }, [user]);

  const formatLastMessageTime = useCallback((timestamp: string): string => {
    return chatService.formatLastMessageTime(timestamp);
  }, []);

  return {
    // State
    chats,
    selectedChat,
    loading,
    error,
    pagination,
    totalUnreadCount,
    
    // Actions
    loadChats,
    selectChat: setSelectedChat,
    createDirectChat,
    createGroupChat,
    updateGroupName,
    updateGroupPhoto,
    addUsersToGroup,
    removeUsersFromGroup,
    leaveGroup,
    deleteGroup,
    archiveChat,
    pinChat,
    markChatAsRead,
    muteChat,
    transferAdmin,
    searchChats,
    refreshUnreadCount,
    
    // Utility methods
    isUserGroupAdmin,
    getChatDisplayName,
    formatLastMessageTime,
  };
}
