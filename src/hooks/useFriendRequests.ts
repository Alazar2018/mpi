import { useState, useEffect, useCallback } from 'react';
import { friendRequestService } from '@/service/friendrequest.server';
import type { FriendRequest, FriendRequestListResponse } from '@/service/friendrequest.server';

interface UseFriendRequestsOptions {
  page?: number;
  limit?: number;
  sort?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseFriendRequestsReturn {
  friendRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  totalRequests: number;
  currentPage: number;
  totalPages: number;
  fetchFriendRequests: (page?: number) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
  clearError: () => void;
}

export const useFriendRequests = (options: UseFriendRequestsOptions = {}): UseFriendRequestsReturn => {
  const {
    page: initialPage = 1,
    limit = 20,
    sort = '-createdAt',
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalRequests, setTotalRequests] = useState(0);

  const fetchFriendRequests = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: FriendRequestListResponse = await friendRequestService.getFriendRequests(page, limit, sort);
      
      // Validate response structure
      if (!response) {
        throw new Error('Invalid response from server');
      }
      
      // Handle different possible response structures
      const requestsData = response.friendRequests || [];
      const totalCount = response.result || 0;
      
      // Ensure requestsData is an array
      if (!Array.isArray(requestsData)) {
        console.warn('Friend requests data is not an array:', requestsData);
        setFriendRequests([]);
        setTotalRequests(0);
        return;
      }
      
      // Filter to only show pending requests
      const pendingRequests = requestsData.filter(request => request.status === 'request');
      
      setFriendRequests(pendingRequests);
      setTotalRequests(totalCount);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
      setError('Failed to fetch friend requests. Please try again.');
      setFriendRequests([]);
      setTotalRequests(0);
    } finally {
      setLoading(false);
    }
  }, [limit, sort]);

  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      setError(null);
      
      await friendRequestService.acceptFriendRequest(friendshipId);
      
      // Remove the accepted request from the list
      setFriendRequests(prev => prev.filter(request => request._id !== friendshipId));
      setTotalRequests(prev => Math.max(0, prev - 1));
      
      console.log('Friend request accepted successfully');
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError('Failed to accept friend request. Please try again.');
    }
  }, []);

  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      setError(null);
      
      await friendRequestService.rejectFriendRequest(friendshipId);
      
      // Remove the rejected request from the list
      setFriendRequests(prev => prev.filter(request => request._id !== friendshipId));
      setTotalRequests(prev => Math.max(0, prev - 1));
      
      console.log('Friend request rejected successfully');
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      setError('Failed to reject friend request. Please try again.');
    }
  }, []);

  const refreshFriendRequests = useCallback(async () => {
    await fetchFriendRequests(currentPage);
  }, [fetchFriendRequests, currentPage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch friend requests on component mount and when dependencies change
  useEffect(() => {
    fetchFriendRequests(initialPage);
  }, [fetchFriendRequests, initialPage]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshFriendRequests();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshFriendRequests]);

  const totalPages = Math.ceil(totalRequests / limit);

  return {
    friendRequests,
    loading,
    error,
    totalRequests,
    currentPage,
    totalPages,
    fetchFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    refreshFriendRequests,
    clearError
  };
};
