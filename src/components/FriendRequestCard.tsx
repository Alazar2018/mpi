import { useState } from 'react';
import Button from './Button';
import type { FriendRequest } from '@/service/friendrequest.server';

interface FriendRequestCardProps {
  friendRequest: FriendRequest;
  onAccept: (friendshipId: string) => Promise<void>;
  onReject: (friendshipId: string) => Promise<void>;
  currentUserId?: string;
}

export default function FriendRequestCard({ 
  friendRequest, 
  onAccept, 
  onReject,
  currentUserId 
}: FriendRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  // Determine which user is the other person (not the current user)
  const otherUser = friendRequest.user1._id === currentUserId ? friendRequest.user2 : friendRequest.user1;
  
  const displayName = `${otherUser.firstName} ${otherUser.lastName}`.trim();
  const initials = otherUser.firstName && otherUser.lastName 
    ? `${otherUser.firstName.charAt(0)}${otherUser.lastName.charAt(0)}`.toUpperCase()
    : otherUser.firstName 
      ? otherUser.firstName.charAt(0).toUpperCase()
      : otherUser.lastName 
        ? otherUser.lastName.charAt(0).toUpperCase()
        : 'U';

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-orange-400 to-red-500',
      'from-purple-400 to-pink-500',
      'from-teal-400 to-green-500',
      'from-indigo-400 to-purple-500'
    ];
    
    try {
      const index = name.charCodeAt(0) % colors.length;
      return colors[index];
    } catch (error) {
      return 'from-gray-400 to-gray-500';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
      return `${Math.floor(diffInMinutes / 10080)}w ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleAction = async (type: 'accept' | 'reject') => {
    if (loading) return;
    
    setLoading(true);
    setActionType(type);
    
    try {
      if (type === 'accept') {
        await onAccept(friendRequest._id);
      } else {
        await onReject(friendRequest._id);
      }
    } catch (error) {
      console.error(`Error ${type}ing friend request:`, error);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {otherUser.avatar ? (
            <img 
              src={otherUser.avatar} 
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getAvatarColor(displayName)} flex items-center justify-center text-white font-semibold text-lg`}>
              {initials}
            </div>
          )}
          
          {/* Online Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white dark:border-gray-800`}></div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              otherUser.isOnline ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {otherUser.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Sent {formatRelativeTime(friendRequest.friendRequestSentAt)}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleAction('accept')}
              disabled={loading}
              className={`flex-1 text-sm py-2 px-3 ${
                loading && actionType === 'accept'
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {loading && actionType === 'accept' ? 'Accepting...' : 'Accept'}
            </Button>
            
            <Button
              onClick={() => handleAction('reject')}
              disabled={loading}
              className={`flex-1 text-sm py-2 px-3 ${
                loading && actionType === 'reject'
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {loading && actionType === 'reject' ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Badge */}
      {friendRequest.notification && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}
