import { useCallback, useEffect, useRef, useState } from "react";
import type { Chat } from "@/service/chat.server";
import { useAuthStore } from "@/store/auth.store";
import { useChatStore } from "@/features/connect/store/chat.store";
import { useMessages } from "@/hooks/useMessages";
import { useChatSocket } from "@/hooks/useSocket";
import { toast } from "react-toastify";
import icons from "@/utils/icons";

export default function DMChat({ 
  chat, 
  onGroupManagement 
}: { 
  chat: Chat | null;
  onGroupManagement?: (chat: Chat) => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const authStore = useAuthStore();
  const chatStore = useChatStore();
  const socket = useChatSocket();
  const [message, setMessage] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState<string>("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Use the new useMessages hook
  const {
    messages, loading: messagesLoading, error: messagesError,
    sendMessage, updateMessage, deleteMessage, formatMessageTime,
    isMessageFromCurrentUser, hasMore, loadMoreMessages
  } = useMessages({
    chatId: chat?._id,
    autoRefresh: true,
    refreshInterval: 10000, // 10 seconds
    onMessageSent: (message) => {
      // Clear the input field when message is sent successfully
      setMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      
      // Reset textarea value and height
      if (textarea.current) {
        textarea.current.value = "";
        textarea.current.style.height = "44px";
        textarea.current.style.minHeight = "44px";
        textarea.current.focus();
      }
    }
  });

  // Get timezone in the required format (+02:00)
  const getTimezone = () => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!chat?._id) return;
    
    // Mark all messages as read when chat is opened
    if (messages.length > 0) {
      chatStore.markAllMessagesAsRead(chat._id);
    }
  }, [chat?._id, messages.length, chatStore]);

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (chat?._id && messages.length > 0) {
      // Mark all messages as read automatically
      chatStore.markAllMessagesAsRead(chat._id);
    }
  }, [chat?._id, messages, chatStore]);

  // Clear input field when switching chats
  useEffect(() => {
    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    
    if (textarea.current) {
      textarea.current.value = "";
      textarea.current.style.height = "44px";
      textarea.current.style.minHeight = "44px";
    }
  }, [chat?._id]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionsMenu) {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  // Sync textarea value with message state
  useEffect(() => {
    if (textarea.current) {
      textarea.current.value = message;
    }
  }, [message]);

  // Clear textarea when message is empty (after sending)
  useEffect(() => {
    if (message === "" && textarea.current) {
      textarea.current.value = "";
      textarea.current.style.height = "44px";
      textarea.current.style.minHeight = "44px";
    }
  }, [message]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size must be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingMessageContent(content);
    setShowActionsMenu(null);
    
    // Force a re-render by updating the textarea value directly
    if (textarea.current) {
      textarea.current.value = content;
      textarea.current.focus();
    }
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingMessageContent("");
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editingMessageContent.trim()) return;
    
    try {
      // Call the updateMessage function from useMessages hook
      const updatedMessage = await updateMessage(editingMessageId, editingMessageContent);
      
      if (updatedMessage) {
        setEditingMessageId(null);
        setEditingMessageContent("");
        // The success toast is now handled by the updateMessage function
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      // Error toast is handled by the updateMessage function
      toast.error('Failed to edit message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // With reverse order, scroll to top to show latest messages
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length]);

  // Sync textarea value when editing state changes
  useEffect(() => {
    if (editingMessageId && editingMessageContent && textarea.current) {
      textarea.current.value = editingMessageContent;
    }
  }, [editingMessageId, editingMessageContent]);

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    // With reverse order, check if user is near the top (where latest messages are)
    const isNearTop = target.scrollTop < 100;
    setShowScrollToBottom(!isNearTop);
  };

  const send = useCallback(async () => {
    if (!message.trim() && !selectedImage) return;
    
    try {
      const sentMessage = await sendMessage(message, selectedImage || undefined);
      
      if (sentMessage) {
        // Input clearing is now handled by the onMessageSent callback
        
        // Emit socket event for real-time delivery
        if (socket && chat?._id) {
          socket.emit('send-message', {
            chatId: chat._id,
            content: message,
            messageId: sentMessage._id,
            senderId: authStore.user?._id,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [message, selectedImage, sendMessage, chat?._id, authStore.user?._id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  function getChatWith() {
    if (chat?.isGroupChat) {
      return null; // For group chats, we don't need a single user
    }
    return chat?.users?.find?.((user) => user._id != authStore.user?._id);
  }

  if (!chat)
    return (
      <div className="flex-1 rounded-2xl overflow-hidden grid place-items-center">
        <span className="text-[var(--text-secondary)] dark:text-gray-400">Select one to start Chat</span>
      </div>
    );

  return (
    <div className="flex-1 rounded-2xl overflow-hidden grid grid-cols-1 grid-rows-[76px_1fr_auto] bg-[var(--bg-card)] dark:bg-gray-800">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between shadow-lg">
        <div className="flex gap-4 items-center">
          {chat?.isGroupChat ? (
            // Group chat header
            <>
              <div className="size-12 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-lg border-2 border-white">
                {chat.photo ? (
                  <img 
                    src={chat.photo} 
                    alt={chat.chatName || 'Group'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600 bg-gradient-to-br from-blue-100 to-blue-200 w-full h-full flex items-center justify-center">
                    {chat.chatName?.charAt(0) || 'G'}
                  </span>
                )}
              </div>
              <div className="text-white">
                <h2 className="font-bold text-lg leading-none mb-1">{chat.chatName || 'Group Chat'}</h2>
                <div className="flex gap-3 items-center leading-5">
                  <span className="text-sm text-black opacity-90 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    👥 {chat.users?.length || 0} members
                  </span>
                  {chat.groupAdmin && (
                    <span className="text-xs opacity-80 bg-yellow-500 bg-opacity-20 px-2 py-1 rounded-full">
                      👑 Admin: {chat.groupAdmin.firstName}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Direct message header
            <>
              <div className="size-12 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-lg border-2 border-white">
                {getChatWith()?.avatar ? (
                  <img 
                    src={getChatWith()?.avatar} 
                    alt={`${getChatWith()?.firstName} ${getChatWith()?.lastName}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600 bg-gradient-to-br from-blue-100 to-blue-200 w-full h-full flex items-center justify-center">
                    {getChatWith()?.firstName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="text-white">
                <h2 className="font-bold text-lg leading-none mb-1">
                  {getChatWith()?.firstName} {getChatWith()?.lastName}
                </h2>
                <div className="text-sm text-black opacity-90 bg-white bg-opacity-20 px-3 py-1 rounded-full inline-block">
                  👤 {getChatWith()?.role || 'User'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chat Status Indicators */}
        <div className="flex items-center gap-3">
          {chat.isPinned && (
            <div className="bg-yellow-500 text-white p-2 rounded-xl shadow-lg" title="Pinned">
              📌
            </div>
          )}
          {chat.isArchived && (
            <div className="bg-gray-500 text-white p-2 rounded-xl shadow-lg" title="Archived">
              📁
            </div>
          )}
          {chat.isMuted && (
            <div className="bg-red-500 text-white p-2 rounded-xl shadow-lg" title="Muted">
              🔇
            </div>
          )}
          {chat.unreadCount > 0 && (
            <div className="bg-red-500 text-white text-sm px-3 py-2 rounded-full shadow-lg font-bold min-w-[24px] text-center">
              {chat.unreadCount}
            </div>
          )}
          {/* Group Settings Button - Only for group chats */}
          {chat.isGroupChat && (
            <button
              onClick={() => {
                if (onGroupManagement) {
                  onGroupManagement(chat);
                }
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
              title="Group Settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)] dark:bg-gray-900 relative" onScroll={handleScroll}>
        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <button
            onClick={() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="absolute bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10"
            title="Scroll to latest messages"
          >
            <span className="text-lg">⬆️</span>
          </button>
        )}

        {/* Messages Container with better padding and spacing */}
        <div className="px-6 py-6 space-y-6">
          {/* Scroll target for auto-scroll (at top for reverse order) */}
          <div ref={messagesEndRef} />
          
        {/* Loading State */}
        {messagesLoading && (
            <div className="flex items-center justify-center h-32">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-[var(--text-primary)] dark:text-white font-medium">Loading messages...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {messagesError && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800">
                <div className="text-4xl mb-3">⚠️</div>
              <p className="text-lg font-medium mb-2">Error loading messages</p>
              <p className="text-sm">{messagesError}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!messagesLoading && !messagesError && messages.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-[var(--text-secondary)] dark:text-gray-400 bg-[var(--bg-card)] dark:bg-gray-700 p-8 rounded-3xl shadow-lg border border-[var(--border-primary)]">
              <div className="text-6xl mb-4">💬</div>
                <p className="text-xl font-semibold mb-2 text-[var(--text-primary)] dark:text-white">No messages yet</p>
                <p className="text-[var(--text-secondary)] dark:text-gray-400">Start the conversation by sending a message!</p>
            </div>
          </div>
        )}

                          {/* Messages List - Display in reverse order (newest to oldest) */}
        <div className="flex flex-col-reverse space-y-reverse space-y-4">
        {messages.map((msg, index) => {
          // Safety check for message structure
          if (!msg || !msg._id) {
            console.warn('Invalid message structure:', msg);
            return null;
          }
              
          const isCurrentUser = isMessageFromCurrentUser(msg);
          
          return (
              <div
                key={msg._id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                >
                  {/* Avatar for other users */}
                  {!isCurrentUser && (
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white">
                        {getChatWith()?.firstName?.charAt(0) || 'U'}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-xl">
                    {/* Message Bubble with improved styling */}
                    <div
                      className={`${
                        isCurrentUser
                          ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-card)] to-[var(--bg-tertiary)] dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 text-[var(--text-primary)] dark:text-white shadow-md hover:shadow-lg border border-[var(--border-primary)]'
                      } ${showActionsMenu === msg._id ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''} 
                      ${editingMessageId === msg._id ? 'ring-2 ring-yellow-400 ring-opacity-75 bg-gradient-to-br from-yellow-400 to-yellow-500' : ''}
                      rounded-2xl px-4 py-3 transition-all duration-300 hover:scale-[1.02] group-hover:shadow-lg`}
                    >
                      {/* Edit Indicator */}
                      {editingMessageId === msg._id && (
                        <div className="mb-2 text-center">
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">
                            ✏️ Editing message...
                          </span>
                        </div>
                      )}
                      
                      {/* Message Content with better typography */}
                      <div className="mb-2">
                        <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                        {msg.image && (
                          <div className="mt-3">
                            <img
                              src={msg.image}
                              alt="Message attachment"
                              className="max-w-full h-auto rounded-xl max-h-64 object-cover shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          </div>
                        )}
                      </div>

                      {/* Message Footer with improved layout */}
                      <div className="flex items-center justify-between">
                        {/* Time */}
                        <span className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-[var(--text-secondary)] dark:text-gray-400'} font-medium`}>
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        
                        {/* Right side - Read status and menu */}
                        <div className="flex items-center gap-2">
                          {/* Read Status - Only tick marks */}
                          {isCurrentUser && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-blue-200">
                                {msg.isRead ? '✓✓' : '✓'}
                              </span>
                            </div>
                          )}
                        
                        {/* Three-dot Menu Icon - Only for current user's messages */}
                          {isCurrentUser && (
                          <button
                            onClick={() => {
                              if (showActionsMenu === msg._id) {
                                setShowActionsMenu(null);
                              } else {
                                setShowActionsMenu(msg._id);
                              }
                            }}
                              className="p-1 text-xs opacity-80 hover:opacity-100 transition-opacity duration-200 hover:bg-white hover:bg-opacity-20 rounded-full"
                            title="Message options"
                          >
                            ⋮
                          </button>
                        )}
                      </div>
                    </div>
                    </div>

                    {/* Message Actions Menu with improved styling */}
                    {isCurrentUser && showActionsMenu === msg._id && (
                      <div className="absolute top-full right-0 mt-2 bg-[var(--bg-card)] dark:bg-gray-800 border border-[var(--border-primary)] rounded-xl shadow-2xl p-2 z-[9999] min-w-[180px] backdrop-blur-sm transform -translate-x-1/2">
                        {/* Arrow indicator */}
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-[var(--bg-card)] dark:bg-gray-800 border-l border-t border-[var(--border-primary)] transform rotate-45"></div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startEditing(msg._id, msg.content);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 font-medium hover:shadow-sm"
                            title="Edit message"
                            type="button"
                          >
                            <span>✏️</span> Edit Message
                          </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Use a more controlled confirmation approach
                            const userConfirmed = window.confirm('Are you sure you want to delete this message?');
                            if (userConfirmed) {
                              try {
                                deleteMessage(msg._id);
                                // Close any open menus
                                setShowActionsMenu(null);
                              } catch (error) {
                                console.error('Failed to delete message:', error);
                              }
                            }
                          }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 font-medium hover:shadow-sm"
                          title="Delete message"
                          type="button"
                        >
                          <span>🗑️</span> Delete Message
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                  
                 
                  
                  {/* Avatar for current user */}
                  {isCurrentUser && (
                    <div className="flex-shrink-0 ml-3 mt-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white">
                        {authStore.user?.firstName?.charAt(0) || 'M'}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>

          {/* Load More Button with improved styling */}
        {hasMore && (
            <div className="text-center pt-4">
            <button
              onClick={loadMoreMessages}
                className="px-8 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-[var(--bg-card)] dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full border-2 border-blue-200 dark:border-blue-600 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-blue-300 dark:hover:border-blue-500"
            >
              📚 Load More Messages
            </button>
          </div>
        )}

        {/* End of Messages Indicator */}
          {/* <div className="text-center py-6">
            <div className="inline-flex items-center gap-3 text-gray-400">
              <div className="w-20 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
              <span className="text-sm font-medium">End of messages</span>
              <div className="w-20 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>
          </div> */}

          {/* Scroll target for auto-scroll */}
          {/* <div ref={messagesEndRef} /> */}
        </div>
      </div>

      {/* Message Input Area */}
      <div className="bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-secondary)] dark:from-gray-700 dark:to-gray-600 p-6 border-t border-[var(--border-primary)] shadow-lg">
        {/* Image Preview with improved styling */}
        {imagePreview && (
          <div className="mb-4 relative">
            <div className="bg-[var(--bg-card)] dark:bg-gray-600 p-3 rounded-xl border border-[var(--border-primary)] inline-block shadow-md">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-28 h-auto rounded-lg shadow-sm"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
                title="Remove image"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mt-2 font-medium">📎 Image will be attached to your message</p>
          </div>
        )}

        {/* Input Container with improved layout */}
        <div className="flex items-end gap-4">
          {/* Image Upload Button with better styling */}
          <label className="cursor-pointer group flex-shrink-0">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="p-3 text-[var(--text-secondary)] dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 border-2 border-[var(--border-primary)] hover:border-blue-400 group-hover:shadow-md hover:scale-105 bg-[var(--bg-card)] dark:bg-gray-600">
              <div className="text-xl">📷</div>
            </div>
          </label>

          {/* Message Input with improved styling */}
          <div className="flex-1 relative">
            
            <textarea
              ref={textarea}
              value={editingMessageId ? editingMessageContent : message}
              onChange={(e) => editingMessageId ? setEditingMessageContent(e.target.value) : setMessage(e.target.value)}
              onKeyPress={editingMessageId ? (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
              } : handleKeyPress}
              onKeyDown={(e) => {
                if (editingMessageId && e.key === 'Escape') {
                  e.preventDefault();
                  cancelEditing();
                }
              }}
              className="w-full p-4 pr-20 border-2 border-[var(--border-primary)] rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
              placeholder={editingMessageId ? "Edit your message..." : "Type your message here..."}
              rows={1}
              style={{ height: '56px', minHeight: '56px' }}
            />
            <div className="absolute right-3 bottom-3 text-xs text-[var(--text-tertiary)] dark:text-gray-500 bg-[var(--bg-card)] dark:bg-gray-600 px-2 py-1 rounded-full">
              {(editingMessageId ? editingMessageContent : message).length}/1000
            </div>
          </div>

          {/* Send/Update Button with improved styling */}
          <button
            onClick={editingMessageId ? saveEdit : send}
            disabled={editingMessageId ? !editingMessageContent.trim() : (!message.trim() && !selectedImage)}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center gap-3 font-semibold text-base hover:scale-105 disabled:hover:scale-100"
          >
            <span>{editingMessageId ? 'Update' : 'Send'}</span>
            <span className="text-lg">{editingMessageId ? '💾' : '🚀'}</span>
          </button>

          {/* Cancel Edit Button */}
          {editingMessageId && (
            <button
              onClick={cancelEditing}
              className="px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 font-semibold text-base hover:scale-105"
            >
              <span>Cancel</span>
              <span className="text-lg">❌</span>
            </button>
          )}
        </div>

        {/* Message Tips with improved styling */}
        <div className="mt-4 text-center">
          {/* Tips removed for cleaner UI */}
        </div>
      </div>
    </div>
  );
}
