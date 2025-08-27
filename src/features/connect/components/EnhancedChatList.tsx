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
    <div className="space-y-4 h-full overflow-y-auto flex flex-col">
      {/* Page Header */}
      <div className="px-4 pt-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white mb-2">
          {currentFilter === 'all' ? 'All Chats' : 
           currentFilter === 'groups' ? 'Groups' : 
           currentFilter === 'direct' ? 'Direct Messages' : 'Unread Chats'}
        </h2>
      </div>

      {/* Horizontal Tabs */}
      <div className="border-b border-[var(--border-primary)]">
        <nav className="flex space-x-8 px-4">
          {[
            { key: 'all', label: 'All Chats' },
            { key: 'groups', label: 'Groups' },
            { key: 'direct', label: 'Direct' },
            { key: 'unread', label: 'Unread' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentFilter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white hover:border-[var(--border-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Bar */}
      <div className="px-4">
        <input
          type="text"
          placeholder="Search chats..."
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
        />
      </div>

              {/* Chat List */}
        <div className="space-y-2 px-4 flex-1 overflow-y-auto min-h-0">
        {/* Pinned Chats Header */}
        {sortedChats.some(chat => chat.isPinned) && (
          <div className="px-3 py-2 bg-[var(--bg-secondary)] dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r">
            <div className="flex items-center gap-2">
              <i dangerouslySetInnerHTML={{ __html: icons.check }} className="text-blue-500" />
              <span className="text-sm font-medium text-[var(--text-primary)] dark:text-blue-200">
                Pinned Chats ({sortedChats.filter(chat => chat.isPinned).length})
              </span>
              {currentFilter !== 'all' && (
                <span className="text-xs text-blue-600 dark:text-blue-300">
                  (filtered view)
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {filteredChats.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="text-6xl" dangerouslySetInnerHTML={{ __html: icons.message }} />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] dark:text-white mb-2">
              {currentFilter === 'all' ? 'No chats yet' :
               currentFilter === 'groups' ? 'No group chats' :
               currentFilter === 'direct' ? 'No direct messages' :
               'No unread messages'}
            </h3>
            <p className="text-[var(--text-secondary)] dark:text-gray-400">
              {currentFilter === 'all' ? 'Start a conversation to see your chats here' :
               currentFilter === 'groups' ? 'Create a group to get started' :
               currentFilter === 'direct' ? 'Send a message to someone to start chatting' :
               'All caught up! No unread messages'}
            </p>
            {currentFilter !== 'all' && safeChats.length > 0 && (
              <p className="text-sm text-[var(--text-tertiary)] dark:text-gray-500 mt-2">
                Switch to "All Chats" to see all your conversations
              </p>
            )}
          </div>
        )}
        
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
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChatId === chat._id
                    ? 'bg-[var(--bg-secondary)] dark:bg-blue-900/20 border border-[var(--border-primary)] dark:border-blue-800'
                    : chat.isPinned
                    ? 'bg-[var(--bg-secondary)] dark:bg-blue-900/20 hover:bg-[var(--bg-tertiary)] dark:hover:bg-blue-800/30 border border-[var(--border-primary)] dark:border-blue-800'
                    : 'hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700'
                }`}
              >
                {/* Chat Avatar/Photo */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
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
                        onLoad={() => {
                        }}
                      />
                    ) : null;
                  })()}
                  <div 
                    className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${
                      chat.isGroupChat ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ display: getChatAvatar(chat) ? 'none' : 'flex' }}
                  >
                    {getChatInitials(chat)}
                  </div>
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-[var(--text-primary)] dark:text-white truncate">
                      {getChatDisplayName(chat)}
                    </h3>
                    {chat.isPinned && (
                      <span className="text-blue-500" title="Pinned chat">
                        <i dangerouslySetInnerHTML={{ __html: icons.check }} />
                      </span>
                    )}
                    {isChatMuted(chat) && (
                      <span className="text-yellow-500" title={getMuteStatusText(chat)}>
                        🔇
                      </span>
                    )}
                    {chat.isGroupChat && onGroupManagement && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGroupManagement(chat);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 transition-colors p-1"
                        title="Group Management"
                      >
                        📁
                      </button>
                    )}
                  </div>

                                     {/* Last Message */}
                   {chat.latestMessageContent && (
                     <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 truncate">
                       {chat.latestMessageContent}
                     </p>
                   )}

                                     {/* Chat Metadata */}
                   <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-secondary)] dark:text-gray-400">
                     {chat.isGroupChat && (
                       <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                         Group • {(chat.users || []).length} members
                       </span>
                     )}
                     {!chat.isGroupChat && (
                       <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                         Direct
                       </span>
                     )}
                     {chat.isArchived && (
                       <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                         Archived
                       </span>
                     )}
                     {isChatMuted(chat) && (
                       <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs">
                         {getMuteStatusText(chat)}
                       </span>
                     )}
                   </div>
                </div>

                                 {/* Right Side Info */}
                 <div className="flex flex-col items-end gap-1 text-xs text-[var(--text-secondary)] dark:text-gray-400">
                  {/* Time */}
                  {chat.latestMessageTimeStamp && (
                    <span>{formatLastMessageTime(chat.latestMessageTimeStamp)}</span>
                  )}
                  
                  {/* Unread Count */}
                  {chat.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {chat.unreadCount}
                    </span>
                  )}

                  {/* Group Settings Icon - Only for group chats */}
                  {chat.isGroupChat && onGroupManagement && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGroupManagement(chat);
                      }}
                      className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                      title="Group Settings"
                    >
                      ⚙️
                    </button>
                  )}
                </div>

                {/* Action Menu */}
                <div className="flex-shrink-0">
                  <div className="relative group">
                                         <Button
                       type="none"
                       className="p-1 hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 rounded"
                     >
                      ⋯
                    </Button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-card)] dark:bg-gray-800 border border-[var(--border-primary)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <div className="py-1">
                        {chat.unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markChatAsRead(chat._id);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] dark:text-white hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700"
                          >
                            Mark as Read
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pinChat(chat._id, !chat.isPinned);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] dark:text-white hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700"
                        >
                          {chat.isPinned ? 'Unpin' : 'Pin'} {chat.isGroupChat ? 'Group' : 'Chat'}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveChat(chat._id, !chat.isArchived);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] dark:text-white hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700"
                        >
                          {chat.isArchived ? 'Unarchive' : 'Archive'} {chat.isGroupChat ? 'Group' : 'Chat'}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isChatMuted(chat)) {
                              // Unmute - send 0 duration
                              muteChat(chat._id, 0);
                            } else {
                              // Mute for 24 hours (default option)
                              muteChat(chat._id, 24);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] dark:text-white hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700"
                        >
                          {isChatMuted(chat) ? 'Unmute' : 'Mute for 24h'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Stats at Bottom */}
      <div className="border-t border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)] dark:bg-gray-700 mt-auto flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-[var(--text-primary)] dark:text-white">
          <span>
            {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''} 
            {currentFilter !== 'all' && (
              <span className="text-[var(--text-secondary)] dark:text-gray-400">
                {' '}({safeChats.length} total)
              </span>
            )}
          </span>
          {totalUnreadCount > 0 && (
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs">
              {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
