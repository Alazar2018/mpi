import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import type { Chat, ChatUser } from '@/service/chat.server';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/Button';

interface GroupManagementProps {
  chat: Chat;
  onClose: () => void;
}

export default function GroupManagement({ chat, onClose }: GroupManagementProps) {
  const { user } = useAuthStore();
  const {
    updateGroupName,
    updateGroupPhoto,
    addUsersToGroup,
    removeUsersFromGroup,
    leaveGroup,
    deleteGroup,
    transferAdmin,
    isUserGroupAdmin
  } = useChat();

  // Safety check: don't render if chat is not properly loaded
  if (!chat || !chat.users) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-[var(--text-primary)] dark:text-white">Loading chat...</span>
        </div>
      </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'settings' | 'statistics'>('info');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(chat.chatName || '');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showRemoveMembers, setShowRemoveMembers] = useState(false);
  const [showTransferAdmin, setShowTransferAdmin] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newAdminId, setNewAdminId] = useState('');
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = isUserGroupAdmin(chat);

  // Get other members (excluding current user)
  const otherMembers = (chat.users || []).filter(member => member._id !== user?._id);

  // Handle group name update
  const handleUpdateName = async () => {
    if (!newGroupName.trim() || newGroupName === chat.chatName) {
      setIsEditingName(false);
      return;
    }

    try {
      setLoading(true);
      await updateGroupName(chat._id, newGroupName);
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update group name:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle photo update
  const handlePhotoUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await updateGroupPhoto(chat._id, file);
    } catch (error) {
      console.error('Failed to update group photo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding members
  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      await addUsersToGroup(chat._id, selectedUsers);
      setShowAddMembers(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to add members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle removing members
  const handleRemoveMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      await removeUsersFromGroup(chat._id, selectedUsers);
      setShowRemoveMembers(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to remove members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle leaving group
  const handleLeaveGroup = async () => {
    try {
      setLoading(true);
      await leaveGroup(chat._id);
      onClose();
    } catch (error) {
      console.error('Failed to leave group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting group
  const handleDeleteGroup = async () => {
    try {
      setLoading(true);
      await deleteGroup(chat._id);
      onClose();
    } catch (error) {
      console.error('Failed to delete group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle transferring admin
  const handleTransferAdmin = async () => {
    if (!newAdminId) return;

    try {
      setLoading(true);
      await transferAdmin(chat._id, newAdminId);
      setShowTransferAdmin(false);
      setNewAdminId('');
    } catch (error) {
      console.error('Failed to transfer admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    // TODO: Implement statistics loading
    setStatistics({
      messageCount: 0,
      memberCount: (chat.users || []).length,
      activeMembers: 0,
      averageResponseTime: '0h'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] dark:text-white">Group Management</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] dark:bg-gray-700">
            <nav className="p-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition-colors ${
                  activeTab === 'info' ? 'bg-blue-100 text-blue-700' : 'hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-600'
                }`}
              >
                Group Info
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition-colors ${
                  activeTab === 'members' ? 'bg-blue-100 text-blue-700' : 'hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-600'
                }`}
              >
                Members
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition-colors ${
                    activeTab === 'settings' ? 'bg-blue-100 text-blue-700' : 'hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-600'
                  }`}
                >
                  Settings
                </button>
              )}
              <button
                onClick={() => setActiveTab('statistics')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'statistics' ? 'bg-blue-100 text-blue-700' : 'hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-600'
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Group Photo */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                    Group Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden">
                      {chat.photo ? (
                        <img
                          src={chat.photo}
                          alt={chat.chatName || 'Group'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-2xl">
                          {chat.chatName?.charAt(0).toUpperCase() || 'G'}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpdate}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Change Photo
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Button
                        onClick={handleUpdateName}
                        disabled={loading}
                        className="px-4"
                      >
                        Save
                      </Button>
                      <Button
                        type="none"
                        onClick={() => {
                          setIsEditingName(false);
                          setNewGroupName(chat.chatName || '');
                        }}
                        className="px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{chat.chatName || 'Unnamed Group'}</span>
                      {isAdmin && (
                        <Button
                          type="none"
                          onClick={() => setIsEditingName(true)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Group Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Members
                    </label>
                    <span className="text-gray-900">{(chat.users || []).length}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created
                    </label>
                    <span className="text-gray-900">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin
                    </label>
                    <span className="text-gray-900">
                      {chat.groupAdmin ? `${chat.groupAdmin.firstName} ${chat.groupAdmin.lastName}` : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex gap-1">
                      {chat.isArchived && <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Archived</span>}
                      {chat.isPinned && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Pinned</span>}
                      {chat.isMuted && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Muted</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Group Members</h3>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowAddMembers(true)}
                        className="px-4 py-2"
                      >
                        Add Members
                      </Button>
                      <Button
                        onClick={() => setShowRemoveMembers(true)}
                        type="none"
                        className="px-4 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove Members
                      </Button>
                    </div>
                  )}
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  {(chat.users || []).map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={`${member.firstName} ${member.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                              {member.firstName?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.role || 'Member'}
                            {member._id === chat.groupAdmin?._id && ' • Admin'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && isAdmin && (
              <div className="space-y-6">
                {/* Transfer Admin */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Transfer Admin Rights</h3>
                  <div className="flex gap-2">
                    <select
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select new admin</option>
                      {(otherMembers || []).map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleTransferAdmin}
                      disabled={!newAdminId || loading}
                      className="px-4"
                    >
                      Transfer
                    </Button>
                  </div>
                </div>

                {/* Delete Group */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Delete Group</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    This action cannot be undone. All messages and data will be permanently deleted.
                  </p>
                  <Button
                    onClick={handleDeleteGroup}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4"
                  >
                    Delete Group
                  </Button>
                </div>
              </div>
            )}

            {/* Leave Group */}
            {!isAdmin && (
              <div>
                <h3 className="text-lg font-medium mb-3">Leave Group</h3>
                <p className="text-sm text-gray-600 mb-3">
                  You will no longer receive messages from this group.
                </p>
                <Button
                  onClick={handleLeaveGroup}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4"
                >
                  Leave Group
                </Button>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Group Statistics</h3>
                  <Button
                    onClick={loadStatistics}
                    disabled={loading}
                    className="px-4"
                  >
                    Refresh
                  </Button>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                )}

                {statistics && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Messages</h4>
                      <p className="text-2xl font-bold text-blue-600">{statistics.messageCount}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Members</h4>
                      <p className="text-2xl font-bold text-green-600">{statistics.memberCount}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Active Members</h4>
                      <p className="text-2xl font-bold text-purple-600">{statistics.activeMembers}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Avg Response Time</h4>
                      <p className="text-2xl font-bold text-orange-600">{statistics.averageResponseTime}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {/* Add Members Modal */}
        {showAddMembers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Add Members</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select users to add to the group. You can add up to 99 members total.
              </p>
              {/* Add user selection interface here */}
              <div className="flex justify-end gap-2">
                <Button
                  type="none"
                  onClick={() => setShowAddMembers(false)}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMembers}
                  disabled={selectedUsers.length === 0 || loading}
                  className="px-4"
                >
                  Add Members
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Members Modal */}
        {showRemoveMembers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Remove Members</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select members to remove from the group.
              </p>
              {/* Add member selection interface here */}
              <div className="flex justify-end gap-2">
                <Button
                  type="none"
                  onClick={() => setShowRemoveMembers(false)}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRemoveMembers}
                  disabled={selectedUsers.length === 0 || loading}
                  className="px-4 bg-red-600 hover:bg-red-700 text-white"
                >
                  Remove Members
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Admin Modal */}
        {showTransferAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Transfer Admin Rights</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a new admin for this group. You will become a regular member.
              </p>
              <select
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              >
                <option value="">Select new admin</option>
                {(otherMembers || []).map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <Button
                  type="none"
                  onClick={() => setShowTransferAdmin(false)}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferAdmin}
                  disabled={!newAdminId || loading}
                  className="px-4"
                >
                  Transfer Admin
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
