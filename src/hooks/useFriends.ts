import { useState, useCallback, useEffect } from 'react';
import { friendsService } from '@/service/friends.server';
import type { FriendshipUser } from '@/service/friends.server';
import { useAuthStore } from '@/store/auth.store';

export interface UseFriendsReturn {
  // State
  friends: FriendshipUser[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadFriends: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  resetError: () => void;
}

export function useFriends(): UseFriendsReturn {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<FriendshipUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load friends list
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await friendsService.getFriendsList();
      
      // Extract friends from the response
      const allFriends: FriendshipUser[] = [];
      
      // Add friends from friendships
      if (response.friendship?.friends) {
        response.friendship.friends.forEach(friendship => {
          // Add the other user in the friendship
          if (friendship.user1._id === user._id) {
            allFriends.push(friendship.user2);
          } else {
            allFriends.push(friendship.user1);
          }
        });
      }
      
      // Add players, coaches, parents
      if (response.players?.players) {
        allFriends.push(...response.players.players);
      }
      if (response.coaches?.coaches) {
        allFriends.push(...response.coaches.coaches);
      }
      if (response.parents?.parents) {
        allFriends.push(...response.parents.parents);
      }
      
      // Remove duplicates based on _id
      const uniqueFriends = allFriends.filter((friend, index, self) => 
        index === self.findIndex(f => f._id === friend._id)
      );
      
      setFriends(uniqueFriends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh friends list
  const refreshFriends = useCallback(async () => {
    await loadFriends();
  }, [loadFriends]);

  // Reset error state
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Load friends on mount
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user, loadFriends]);

  return {
    friends,
    loading,
    error,
    loadFriends,
    refreshFriends,
    resetError
  };
}
