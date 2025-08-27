import { useState, useCallback } from 'react';
import { friendsService } from '@/service/friends.server';
import type { SearchUser } from '@/service/friends.server';

export interface UseUserSearchReturn {
  // State
  users: SearchUser[];
  loading: boolean;
  error: string | null;
  
  // Actions
  searchUsers: (query: string, role?: string) => Promise<void>;
  clearSearch: () => void;
  resetError: () => void;
}

export function useUserSearch(): UseUserSearchReturn {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for users by name and optionally by role
  const searchUsers = useCallback(async (query: string, role?: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await friendsService.searchUsers({ 
        name: query.trim(),
        role: role || undefined
      });
      
      setUsers(response.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear search results
  const clearSearch = useCallback(() => {
    setUsers([]);
    setError(null);
  }, []);

  // Reset error state
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    users,
    loading,
    error,
    searchUsers,
    clearSearch,
    resetError
  };
}
