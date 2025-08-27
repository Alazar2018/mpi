import icons from "@/utils/icons";
import { useChatStore } from "./store/chat.store";
import type { Chat } from "@/service/chat.server";
import { useAuthStore } from "@/store/auth.store";
import { useChat } from "@/hooks/useChat";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useFriends } from "@/hooks/useFriends";
import DMChat from "./components/DMChat";
import EnhancedChatList from "./components/EnhancedChatList";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Messages() {
  const authStore = useAuthStore();
  const chatStore = useChatStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState(""); // Separate state for group name
  const [messageText, setMessageText] = useState(""); // For initial message

  // Group management modal states
  const [showGroupManagementModal, setShowGroupManagementModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [showRemoveUsersModal, setShowRemoveUsersModal] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedGroupForManagement, setSelectedGroupForManagement] = useState<Chat | null>(null);
  const [transferAdminUserId, setTransferAdminUserId] = useState("");

  // Use the new useChat hook for real data
  const {
    chats,
    selectedChat,
    loading,
    error,
    createDirectChat,
    createGroupChat,
    selectChat,
    updateGroupName,
    updateGroupPhoto,
    addUsersToGroup,
    removeUsersFromGroup,
    leaveGroup,
    deleteGroup,
    transferAdmin,
    isUserGroupAdmin
  } = useChat({ autoRefresh: true });

  // Use the new useUserSearch hook for real user data
  const {
    users: availableUsers,
    loading: userLoading,
    error: userError,
    searchUsers,
    clearSearch,
    resetError
  } = useUserSearch();

  // Use the new useFriends hook for existing friends
  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
    refreshFriends
  } = useFriends();

  // Use selectedChat from the hook instead of store
  const selected = selectedChat;

  // Handle user search
  const handleUserSearch = (query: string) => {
    if (query.trim()) {
      searchUsers(query);
    } else {
      clearSearch();
    }
  };

  // Handle user selection for creating new chats
  const handleUserSelect = (user: any) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Handle user removal from selection
  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  // Handle creating new chat
  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      if (selectedUsers.length === 1) {
        // Create direct chat
        const chat = await createDirectChat(selectedUsers[0]._id);
        selectChat(chat);
        setShowCreateModal(false);
        setSelectedUsers([]);
        setGroupName("");
        setMessageText("");
        toast.success('Direct chat created successfully!');
      } else {
        // Create group chat - require group name
        if (!groupName.trim()) {
          alert('Please enter a group name');
          return;
        }
        
        if (groupName.trim().length < 1 || groupName.trim().length > 50) {
          alert('Group name must be between 1 and 50 characters');
          return;
        }
        
        const chat = await createGroupChat(
          selectedUsers.map(u => u._id),
          groupName.trim()
        );
        selectChat(chat);
        setShowCreateModal(false);
        setSelectedUsers([]);
        setGroupName("");
        setMessageText("");
        toast.success(`Group "${groupName.trim()}" created successfully with ${selectedUsers.length} member${selectedUsers.length !== 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create chat. Please try again.');
    }
  };

  // Open group management modal
  const openGroupManagement = (chat: Chat) => {
    setSelectedGroupForManagement(chat);
    setShowGroupManagementModal(true);
   // toast.info(`Opening group settings for "${chat.chatName || 'Unnamed Group'}"`);
  };

  // Group management functions
  const handleEditGroupName = async () => {
    if (!selectedGroupForManagement || !editingGroupName.trim()) return;
    
    try {
      await updateGroupName(selectedGroupForManagement._id, editingGroupName.trim());
      toast.success(`Group name updated to "${editingGroupName.trim()}" successfully!`);
      setShowEditGroupModal(false);
      setEditingGroupName("");
      setSelectedGroupForManagement(null);
    } catch (error) {
      console.error('Failed to update group name:', error);
      toast.error('Failed to update group name. Please try again.');
    }
  };

  const handleUpdateGroupPhoto = async (file: File) => {
    if (!selectedGroupForManagement) return;
    
    try {
      await updateGroupPhoto(selectedGroupForManagement._id, file);
      toast.success(`Group photo updated successfully!`);
      setShowGroupManagementModal(false);
      setSelectedGroupForManagement(null);
    } catch (error) {
      console.error('Failed to update group photo:', error);
      toast.error('Failed to update group photo. Please try again.');
    }
  };

  const handleAddUsersToGroup = async (userIds: string[]) => {
    if (!selectedGroupForManagement || userIds.length === 0) return;
    
    try {
      await addUsersToGroup(selectedGroupForManagement._id, userIds);
      toast.success(`${userIds.length} member${userIds.length !== 1 ? 's' : ''} added to "${selectedGroupForManagement.chatName || 'Unnamed Group'}" successfully!`);
      setShowAddUsersModal(false);
      setSelectedGroupForManagement(null);
    } catch (error) {
      console.error('Failed to add users to group:', error);
      toast.error('Failed to add users to group. Please try again.');
    }
  };

  const handleRemoveUsersFromGroup = async (userIds: string[]) => {
    if (!selectedGroupForManagement || userIds.length === 0) return;
    
    try {
      await removeUsersFromGroup(selectedGroupForManagement._id, userIds);
      toast.success(`${userIds.length} member${userIds.length !== 1 ? 's' : ''} removed from "${selectedGroupForManagement.chatName || 'Unnamed Group'}" successfully!`);
      setShowRemoveUsersModal(false);
      setSelectedGroupForManagement(null);
    } catch (error) {
      console.error('Failed to remove users from group:', error);
      toast.error('Failed to remove users from group. Please try again.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroupForManagement) return;
    
    if (confirm('Are you sure you want to leave this group?')) {
      try {
        await leaveGroup(selectedGroupForManagement._id);
        toast.success(`You have left "${selectedGroupForManagement.chatName || 'Unnamed Group'}" successfully!`);
        setShowGroupManagementModal(false);
        setSelectedGroupForManagement(null);
      } catch (error) {
        console.error('Failed to leave group:', error);
        toast.error('Failed to leave group. Please try again.');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupForManagement) return;
    
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await deleteGroup(selectedGroupForManagement._id);
        toast.success(`"${selectedGroupForManagement.chatName || 'Unnamed Group'}" has been deleted successfully!`);
        setShowGroupManagementModal(false);
        setSelectedGroupForManagement(null);
      } catch (error) {
        console.error('Failed to delete group:', error);
        toast.error('Failed to delete group. Please try again.');
      }
    }
  };

  const handleTransferAdmin = async () => {
    if (!selectedGroupForManagement || !transferAdminUserId) return;
    
    try {
      await transferAdmin(selectedGroupForManagement._id, transferAdminUserId);
      toast.success(`Admin rights transferred successfully for "${selectedGroupForManagement.chatName || 'Unnamed Group'}"!`);
      setShowTransferAdminModal(false);
      setSelectedGroupForManagement(null);
      setTransferAdminUserId("");
    } catch (error) {
      console.error('Failed to transfer admin:', error);
      toast.error('Failed to transfer admin. Please try again.');
    }
  };

  const openEditGroupName = (chat: Chat) => {
    setSelectedGroupForManagement(chat);
    setEditingGroupName(chat.chatName || '');
    setShowEditGroupModal(true);
    toast.info(`Editing group name for "${chat.chatName || 'Unnamed Group'}"`);
  };

  const openAddUsers = (chat: Chat) => {
    setSelectedGroupForManagement(chat);
    setSelectedUsers([]); // Clear selected users
    setShowAddUsersModal(true);
    toast.info(`Adding members to "${chat.chatName || 'Unnamed Group'}"`);
  };

  const openRemoveUsers = (chat: Chat) => {
    setSelectedGroupForManagement(chat);
    setSelectedUsers([]); // Clear selected users
    setShowRemoveUsersModal(true);
    toast.info(`Removing members from "${chat.chatName || 'Unnamed Group'}"`);
  };

  const resetModalStates = () => {
    setShowGroupManagementModal(false);
    setShowEditGroupModal(false);
    setShowAddUsersModal(false);
    setShowRemoveUsersModal(false);
    setShowTransferAdminModal(false);
    setSelectedGroupForManagement(null);
    setSelectedUsers([]);
    setEditingGroupName("");
    setSearchQuery("");
    setTransferAdminUserId("");
  };

  // Handle chat selection
  const handleChatSelect = (chat: Chat) => {
    selectChat(chat);
  };

  return (
    <div className="flex flex-1 bg-[var(--bg-primary)] overflow-hidden">
      {/* Chat List Sidebar */}
      <div className="w-1/3 border-r border-[var(--border-primary)] flex flex-col min-h-0">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-primary)] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white">Messages</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
                  <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
                </button>
              </div>
            </div>

        {/* Enhanced Chat List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <EnhancedChatList
            onChatSelect={handleChatSelect}
            selectedChatId={selected?._id}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selected ? (
          <DMChat 
            chat={selected} 
            onGroupManagement={selected.isGroupChat ? openGroupManagement : undefined}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] dark:text-gray-400">
            <div className="text-center">
              <i className="text-6xl mb-4" dangerouslySetInnerHTML={{ __html: icons.message }} />
              <p className="text-xl">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white">Create New Chat</h3>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                className="text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white"
                >
                  <i dangerouslySetInnerHTML={{ __html: icons.close }} />
                </button>
              </div>

            {/* Group Name Input (for group chats) */}
            {selectedUsers.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white ${
                    groupName.trim() ? 'border-green-300' : 'border-[var(--border-primary)]'
                  }`}
                  maxLength={50}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-[var(--text-secondary)] dark:text-gray-400">
                    Group name is required and must be 1-50 characters
                  </p>
                  <span className={`text-xs ${
                    groupName.length > 40 ? 'text-red-500' : 
                    groupName.length > 30 ? 'text-yellow-500' : 'text-[var(--text-secondary)] dark:text-gray-400'
                  }`}>
                    {groupName.length}/50
                  </span>
                </div>
              </div>
            )}

            {/* User Selection */}
              <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white mb-3">Select Users</h3>
              
              {/* Quick Add Friends */}
              {friends.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">Quick Add Friends</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {friends.map((friend) => (
                      <div
                        key={friend._id}
                        onClick={() => handleUserSelect(friend)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.find(u => u._id === friend._id)
                            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                            : 'hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          {friend.avatar ? (
                            <img
                              src={friend.avatar}
                              alt={`${friend.firstName} ${friend.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                              {friend.firstName?.charAt(0) || 'F'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">
                            {friend.firstName} {friend.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {friend.isOnline ? 'Online' : 'Offline'}
                          </div>
                        </div>
                        {selectedUsers.find(u => u._id === friend._id) && (
                          <div className="text-blue-500">
                            <i dangerouslySetInnerHTML={{ __html: icons.check }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* User Search Input */}
              <div className="mb-4">
                  <input
                    type="text"
                  placeholder="Search users by name..."
                    value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleUserSearch(e.target.value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {userLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Searching users...</p>
                </div>
              ) : userError ? (
                <div className="text-center py-4 text-red-500">
                  <p className="text-sm">{userError}</p>
                  <button
                    onClick={resetError}
                    className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : availableUsers.length === 0 && searchQuery.trim() ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No users found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : availableUsers.length === 0 && !searchQuery.trim() ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">Search for users to start a chat</p>
                  <p className="text-sm">Type a name to search</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.find(u => u._id === user._id)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : 'hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700'
                      }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--bg-tertiary)] dark:bg-gray-600 flex items-center justify-center text-[var(--text-secondary)] dark:text-gray-400 font-medium">
                            {user.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-[var(--text-primary)] dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                          {user.role || 'User'}
                        </div>
                      </div>
                      {selectedUsers.find(u => u._id === user._id) && (
                        <div className="text-blue-500">
                          <i dangerouslySetInnerHTML={{ __html: icons.check }} />
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {/* Selected Users Section */}
            {selectedUsers.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white">Selected Users</h3>
                  <span className="text-sm text-[var(--text-secondary)] dark:text-gray-400">{selectedUsers.length} Users</span>
                  </div>
                  <div className="space-y-2">
                    {selectedUsers.map((user) => (
                      <div key={user._id} className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--bg-tertiary)] dark:bg-gray-600 flex items-center justify-center text-[var(--text-secondary)] dark:text-gray-400 font-medium">
                            {user.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-[var(--text-primary)] dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                          {user.role || 'User'}
                        </div>
                        </div>
                        <button
                          onClick={() => handleUserRemove(user._id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <i dangerouslySetInnerHTML={{ __html: icons.close }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={
                    selectedUsers.length === 0 || 
                    (selectedUsers.length > 1 && !groupName.trim())
                  }
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {selectedUsers.length > 1 ? 'Create Group' : 'Create Chat'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {showGroupManagementModal && selectedGroupForManagement && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white">⚙️ Group Settings</h3>
              <button 
                onClick={resetModalStates} 
                className="text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.close }} />
              </button>
            </div>

            {/* Group Info */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  {selectedGroupForManagement.photo ? (
                    <img
                      src={selectedGroupForManagement.photo}
                      alt={selectedGroupForManagement.chatName || 'Group'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {selectedGroupForManagement.chatName?.charAt(0) || 'G'}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] dark:text-white">
                    {selectedGroupForManagement.chatName || 'Unnamed Group'}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                    {selectedGroupForManagement.users?.length || 0} members
                  </p>
                  {selectedGroupForManagement.groupAdmin && (
                    <p className="text-xs text-[var(--text-tertiary)] dark:text-gray-500">
                      Admin: {selectedGroupForManagement.groupAdmin.firstName} {selectedGroupForManagement.groupAdmin.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="mt-4">
                <h5 className="text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">Members</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedGroupForManagement.users?.map((user) => (
                    <div key={user._id} className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--bg-tertiary)] dark:bg-gray-600 flex items-center justify-center text-[var(--text-secondary)] dark:text-gray-400 font-medium text-xs">
                            {user.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)] dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] dark:text-gray-400">
                          {user.role || 'User'}
                          {selectedGroupForManagement.groupAdmin?._id === user._id && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">(Admin)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Group Actions */}
            <div className="space-y-3">
              {/* View Chat Button - Always available */}
              <button
                onClick={() => {
                  setShowGroupManagementModal(false);
                  setSelectedGroupForManagement(null);
                }}
                className="w-full text-left px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700"
              >
                💬 View Chat
              </button>

              {/* Admin Actions - Only for group admins */}
              {isUserGroupAdmin(selectedGroupForManagement) ? (
                <>
                  <button
                    onClick={() => openEditGroupName(selectedGroupForManagement)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    ✏️ Edit Group Name
                  </button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handleUpdateGroupPhoto(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    📷 Update Group Photo
                  </button>
                  <button
                    onClick={() => openAddUsers(selectedGroupForManagement)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    ➕ Add Members
                  </button>
                  <button
                    onClick={() => openRemoveUsers(selectedGroupForManagement)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    ➖ Remove Members
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGroupForManagement(selectedGroupForManagement);
                      setShowTransferAdminModal(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    ⚙️ Transfer Admin
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                  >
                    🗑️ Delete Group
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLeaveGroup}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                >
                  🚪 Leave Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Name Modal */}
      {showEditGroupModal && selectedGroupForManagement && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white">Edit Group Name</h3>
              <button 
                onClick={resetModalStates} 
                className="text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.close }} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                Group Name *
              </label>
              <input
                type="text"
                placeholder="Enter new group name"
                value={editingGroupName}
                onChange={(e) => setEditingGroupName(e.target.value)}
                className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                maxLength={50}
              />
              <p className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mt-1">
                Group name must be 1-50 characters
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={resetModalStates}
                className="px-4 py-2 text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditGroupName}
                disabled={!editingGroupName.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Update Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Users Modal */}
      {showAddUsersModal && selectedGroupForManagement && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white">Add Members to Group</h3>
              <button 
                onClick={resetModalStates} 
                className="text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.close }} />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleUserSearch(e.target.value);
                }}
                className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
              />
            </div>

            {userLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400">Searching users...</p>
              </div>
            ) : availableUsers.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.find(u => u._id === user._id)
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                          {user.firstName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)] dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                        {user.role || 'User'}
                      </div>
                    </div>
                    {selectedUsers.find(u => u._id === user._id) && (
                      <div className="text-blue-500">
                        <i dangerouslySetInnerHTML={{ __html: icons.check }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)] dark:text-gray-400">
                <p>No users found</p>
                <p className="text-sm">Search for users to add</p>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">Selected Users</h4>
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div key={user._id} className="flex items-center gap-3 p-2 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--bg-tertiary)] dark:bg-gray-600 flex items-center justify-center text-[var(--text-secondary)] dark:text-gray-400 font-medium text-xs">
                            {user.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)] dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUserRemove(user._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <i dangerouslySetInnerHTML={{ __html: icons.close }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetModalStates}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddUsersToGroup(selectedUsers.map(u => u._id))}
                disabled={selectedUsers.length === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Users Modal */}
      {showRemoveUsersModal && selectedGroupForManagement && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white">Remove Members from Group</h3>
              <button 
                onClick={resetModalStates} 
                className="text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.close }} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 mb-4">
                Select members to remove from "{selectedGroupForManagement.chatName || 'Unnamed Group'}"
              </p>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedGroupForManagement.users?.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.find(u => u._id === user._id)
                      ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
                      : 'hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                                            ) : (
                          <div className="w-full h-full bg-[var(--bg-tertiary)] dark:bg-gray-600 flex items-center justify-center text-[var(--text-secondary)] dark:text-gray-400 font-medium">
                            {user.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)] dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                          {user.role || 'User'}
                          {selectedGroupForManagement.groupAdmin?._id === user._id && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">(Admin)</span>
                          )}
                        </div>
                      </div>
                  {selectedUsers.find(u => u._id === user._id) && (
                    <div className="text-red-500">
                      <i dangerouslySetInnerHTML={{ __html: icons.check }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">Selected for Removal</h4>
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div key={user._id} className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--bg-tertiary)] dark:bg-gray-600 flex items-center justify-center text-[var(--text-secondary)] dark:text-gray-400 font-medium text-xs">
                            {user.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)] dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUserRemove(user._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <i dangerouslySetInnerHTML={{ __html: icons.close }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetModalStates}
                className="px-4 py-2 text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveUsersFromGroup(selectedUsers.map(u => u._id))}
                disabled={selectedUsers.length === 0}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Remove {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Admin Modal */}
      {showTransferAdminModal && selectedGroupForManagement && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-white">Transfer Admin Rights</h3>
              <button 
                onClick={resetModalStates} 
                className="text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.close }} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                Select New Admin
              </label>
              <select
                value={transferAdminUserId}
                onChange={(e) => setTransferAdminUserId(e.target.value)}
                className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
              >
                <option value="">Select a member</option>
                {selectedGroupForManagement.users?.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} {user.role || 'User'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mt-1">
                Choose a member to transfer admin rights to
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={resetModalStates}
                className="px-4 py-2 text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferAdmin}
                disabled={!transferAdminUserId}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Transfer Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
