import React, { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import type { Chat } from '@/service/chat.server';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/Button';
import icons from '@/utils/icons';

interface EnhancedChatListProps {
  onChatSelect: (chat: Chat) => void;
  onGroupManagement?: (chat: Chat) => void; // New prop for group management
  selectedChatId?: string;
  filter?: 'all' | 'groups' | 'direct' | 'unread';
}

export default function EnhancedChatList({ onChatSelect, onGroupManagement, selectedChatId, filter = 'all' }: EnhancedChatListProps) {
  const { user } = useAuthStore();
  const [currentFilter, setCurrentFilter] = useState<'all' | 'groups' | 'direct' | 'unread'>(filter);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    chats,
    loading,
    error,
    totalUnreadCount,
    loadChats,
    markChatAsRead,
    pinChat,
    archiveChat,
    muteChat
  } = useChat({ autoRefresh: true, initialFilter: filter });

  // Safety check: ensure chats is always an array
  const safeChats = chats || [];

  // Filter chats based on current filter
  const filteredChats = safeChats.filter(chat => {
    switch (currentFilter) {
      case 'groups':
        return chat.isGroupChat === true;
      case 'direct':
        return chat.isGroupChat === false;
      case 'unread':
        return chat.unreadCount > 0;
      default:
        return true; // 'all' shows everything
    }
  });

  // Sort chats: pinned first, then by latest message time
  const sortedChats = [...filteredChats].sort((a, b) => {
    // First priority: pinned chats go to the top
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Second priority: if both are pinned or both are not pinned, sort by latest message time
    const aTime = a.latestMessageTimeStamp ? new Date(a.latestMessageTimeStamp).getTime() : 0;
    const bTime = b.latestMessageTimeStamp ? new Date(b.latestMessageTimeStamp).getTime() : 0;
    
    return bTime - aTime; // Most recent first
  });

  // Handle filter change
  const handleFilterChange = (newFilter: 'all' | 'groups' | 'direct' | 'unread') => {
    setCurrentFilter(newFilter);
    loadChats(newFilter);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    if (searchTerm.trim()) {
      // TODO: Implement search functionality
      // For now, just reload chats with current filter
      loadChats(currentFilter);
    } else {
      loadChats(currentFilter);
    }
  };

  // Get chat display name
  const getChatDisplayName = (chat: Chat): string => {
    if (chat.isGroupChat) {
      return chat.chatName || 'Group Chat';
    } else {
      // For direct chats, show the other user's name
      if (chat.users && chat.users.length > 0) {
        const otherUser = chat.users.find(u => u._id !== user?._id);
        if (otherUser) {
          return `${otherUser.firstName} ${otherUser.lastName}`;
        }
      }
      return 'Direct Chat';
    }
  };

  // Get chat avatar
  const getChatAvatar = (chat: Chat): string | null => {
    if (chat.isGroupChat) {
      return chat.photo || null;
    } else {
      // For direct chats, show the other user's avatar
      if (chat.users && chat.users.length > 0) {
        const otherUser = chat.users.find(u => u._id !== user?._id);
        if (otherUser) {
          return otherUser.avatar || null;
        } else {
          return null;
        }
      }
      return null;
    }
  };

  // Check if chat is muted
  const isChatMuted = (chat: Chat): boolean => {
    if (chat.mutedUntil) {
      const mutedUntil = new Date(chat.mutedUntil);
      const now = new Date();
      return mutedUntil > now;
    }
    return chat.isMuted || false;
  };

  // Get mute status text
  const getMuteStatusText = (chat: Chat): string => {
    if (chat.mutedUntil) {
      const mutedUntil = new Date(chat.mutedUntil);
      const now = new Date();
      const diffInMs = mutedUntil.getTime() - now.getTime();
      
      if (diffInMs <= 0) {
        return 'Mute expired';
      }
      
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInMinutes < 60) {
        return `Muted for ${diffInMinutes} min`;
      } else if (diffInHours < 24) {
        return `Muted for ${diffInHours}h`;
      } else {
        return `Muted for ${diffInDays}d`;
      }
    }
    return chat.isMuted ? 'Muted' : '';
  };

  // Get chat initials
  const getChatInitials = (chat: Chat): string => {
    const displayName = getChatDisplayName(chat);
    return displayName.charAt(0).toUpperCase();
  };

  // Format last message time
  const formatLastMessageTime = (timestamp: string): string => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading && safeChats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-[var(--text-secondary)] dark:text-gray-400">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading chats</p>
          <Button onClick={() => loadChats(currentFilter)}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Mobile Header with Burger Menu */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {}}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <div className={`h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300`}></div>
                <div className={`h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300`}></div>
                <div className={`h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300`}></div>
              </div>
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Messages
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {filteredChats.length} chats
            </span>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                {totalUnreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Messages
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {filteredChats.length} chats
            </span>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                {totalUnreadCount} unread
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300`} onClick={() => {}}></div>

      {/* Mobile Menu Sidebar */}
      <div className={`lg:hidden fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300`}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chats</h3>
              <button
                onClick={() => {}}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <span className="text-lg text-gray-600 dark:text-gray-300">×</span>
              </button>
            </div>
            
            {/* Filter Dropdown */}
            <div className="mb-4">
              <select
                value={currentFilter}
                onChange={(e) => handleFilterChange(e.target.value as any)}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Chats</option>
                <option value="groups">Groups</option>
                <option value="direct">Direct Messages</option>
                <option value="unread">Unread</option>
              </select>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm shadow-sm"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/* Mobile Chat List */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Pinned Chats Header */}
            {sortedChats.some(chat => chat.isPinned) && (
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 text-sm">📌</span>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-200">
                    Pinned ({sortedChats.filter(chat => chat.isPinned).length})
                  </span>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {filteredChats.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-gray-300 dark:text-gray-600 mb-4">
                  <div className="text-4xl">💬</div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {currentFilter === 'all' ? 'No chats yet' :
                   currentFilter === 'groups' ? 'No group chats' :
                   currentFilter === 'direct' ? 'No direct messages' :
                   'No unread messages'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentFilter === 'all' ? 'Start a conversation to see your chats here' :
                   currentFilter === 'groups' ? 'Create a group to get started' :
                   currentFilter === 'direct' ? 'Send a message to someone to start chatting' :
                   'All caught up! No unread messages'}
                </p>
              </div>
            )}
            
            {/* Chat Items */}
            <div className="space-y-2">
              {sortedChats.map((chat, index) => {
                // Add separator between pinned and unpinned chats
                const showSeparator = index > 0 && 
                  sortedChats[index - 1].isPinned && 
                  !chat.isPinned;
                
                return (
                  <React.Fragment key={chat._id}>
                    {showSeparator && (
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    )}
                    <div
                      onClick={() => {
                        onChatSelect(chat);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedChatId === chat._id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                          : chat.isPinned
                          ? 'bg-gray-50 dark:bg-gray-700 border border-blue-100 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {/* Chat Avatar/Photo */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {(() => {
                          const avatarUrl = getChatAvatar(chat);
                          return avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={getChatDisplayName(chat)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null;
                        })()}
                        <div 
                          className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${
                            chat.isGroupChat ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                          }`}
                          style={{ display: getChatAvatar(chat) ? 'none' : 'flex' }}
                        >
                          {getChatInitials(chat)}
                        </div>
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                            {getChatDisplayName(chat)}
                          </h3>
                          {chat.isPinned && (
                            <span className="text-blue-500 text-xs" title="Pinned chat">
                              📌
                            </span>
                          )}
                          {isChatMuted(chat) && (
                            <span className="text-yellow-500 text-xs" title={getMuteStatusText(chat)}>
                              🔇
                            </span>
                          )}
                        </div>

                        {/* Last Message */}
                        {chat.latestMessageContent && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {chat.latestMessageContent}
                          </p>
                        )}

                        {/* Chat Type Badge */}
                        <div className="flex items-center gap-1 mt-1">
                          {chat.isGroupChat && (
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-xs font-medium">
                              Group
                            </span>
                          )}
                          {!chat.isGroupChat && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full text-xs font-medium">
                              Direct
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side Info */}
                      <div className="flex flex-col items-end gap-1 text-xs">
                        {/* Time */}
                        {chat.latestMessageTimeStamp && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {formatLastMessageTime(chat.latestMessageTimeStamp)}
                          </span>
                        )}
                        
                        {/* Unread Count */}
                        {chat.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Mobile Menu Stats */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Total: {safeChats.length}</span>
              <span>Filtered: {filteredChats.length}</span>
              {totalUnreadCount > 0 && (
                <span className="text-red-500">Unread: {totalUnreadCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Desktop Navigation */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All Chats' },
              { key: 'groups', label: 'Groups' },
              { key: 'direct', label: 'Direct' },
              { key: 'unread', label: 'Unread' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  currentFilter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden lg:block p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-4 pl-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* Chat List - Hidden on Mobile */}
        <div className="hidden lg:block h-full overflow-y-auto p-4 lg:p-6">
          {/* Pinned Chats Header */}
          {sortedChats.some(chat => chat.isPinned) && (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-blue-500 text-lg">📌</span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-200">
                  Pinned Chats ({sortedChats.filter(chat => chat.isPinned).length})
                </span>
                {currentFilter !== 'all' && (
                  <span className="text-xs text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                    filtered view
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {filteredChats.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-gray-300 dark:text-gray-600 mb-6">
                <div className="text-8xl mb-4">💬</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {currentFilter === 'all' ? 'No chats yet' :
                 currentFilter === 'groups' ? 'No group chats' :
                 currentFilter === 'direct' ? 'No direct messages' :
                 'No unread messages'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {currentFilter === 'all' ? 'Start a conversation to see your chats here' :
                 currentFilter === 'groups' ? 'Create a group to get started' :
                 currentFilter === 'direct' ? 'Send a message to someone to start chatting' :
                 'All caught up! No unread messages'}
              </p>
              {currentFilter !== 'all' && safeChats.length > 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Switch to "All Chats" to see all your conversations
                </p>
              )}
            </div>
          )}
          
                    {/* Chat Items */}
          <div className="space-y-3">
            {sortedChats.map((chat, index) => {
              // Add separator between pinned and unpinned chats
              const showSeparator = index > 0 && 
                sortedChats[index - 1].isPinned && 
                !chat.isPinned;
              
              return (
                <React.Fragment key={chat._id}>
                  {showSeparator && (
                    <div className="border-t border-[var(--border-primary)] my-2"></div>
                  )}
                  <div
                    onClick={() => onChatSelect(chat)}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                      selectedChatId === chat._id
                        ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-lg'
                        : chat.isPinned
                        ? 'bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    {/* Chat Avatar/Photo */}
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-md">
                      {(() => {
                        const avatarUrl = getChatAvatar(chat);
                        return avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={getChatDisplayName(chat)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null;
                      })()}
                      <div 
                        className={`w-full h-full flex items-center justify-center text-white font-bold text-xl ${
                          chat.isGroupChat ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                        }`}
                        style={{ display: getChatAvatar(chat) ? 'none' : 'flex' }}
                      >
                        {getChatInitials(chat)}
                      </div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                          {getChatDisplayName(chat)}
                        </h3>
                        {chat.isPinned && (
                          <span className="text-blue-500 text-sm" title="Pinned chat">
                            📌
                          </span>
                        )}
                        {isChatMuted(chat) && (
                          <span className="text-yellow-500 text-sm" title={getMuteStatusText(chat)}>
                            🔇
                          </span>
                        )}
                      </div>

                      {/* Last Message */}
                      {chat.latestMessageContent && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                          {chat.latestMessageContent}
                        </p>
                      )}

                      {/* Chat Metadata */}
                      <div className="flex items-center gap-2 text-xs">
                        {chat.isGroupChat && (
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                            Group • {(chat.users || []).length} members
                          </span>
                        )}
                        {!chat.isGroupChat && (
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                            Direct
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Side Info */}
                    <div className="flex flex-col items-end gap-2 text-xs">
                      {/* Time */}
                      {chat.latestMessageTimeStamp && (
                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                          {formatLastMessageTime(chat.latestMessageTimeStamp)}
                        </span>
                      )}
                      
                      {/* Unread Count */}
                      {chat.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center font-bold shadow-sm">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
