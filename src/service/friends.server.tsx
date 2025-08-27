import axiosInstance from "@/config/axios.config";
import { useAuthStore } from "@/store/auth.store";
import { API_CONFIG } from "@/config/api.config";

// Types for Friendship Management based on API response
export interface FriendshipUser {
  _id: string;
  firstName: string;
  lastName: string;
  isOnline: boolean;
  avatar: string;
}

export interface Friendship {
  _id: string;
  user1: FriendshipUser;
  user2: FriendshipUser;
  user1IsBlocked: boolean;
  user2IsBlocked: boolean;
  status: 'request' | 'friends' | 'blocked';
  friendRequestSentAt?: string;
  becameFriendsAt?: string;
  notification: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  _id: string;
  user1: FriendshipUser;
  user2: FriendshipUser;
  status: 'request';
  friendRequestSentAt: string;
  notification: boolean;
  createdAt: string;
}

export interface SendFriendRequestRequest {
  user2: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface FriendRequestsResponse {
  result: number;
  friendRequests: FriendRequest[];
}

export interface FriendsListResponse {
  friendship: {
    result: number;
    friends: Friendship[];
  };
  players: {
    result: number;
    players: FriendshipUser[];
  };
  coaches: {
    result: number;
    coaches: FriendshipUser[];
  };
  parents: {
    result: number;
    parents: FriendshipUser[];
  };
}

export interface BlockedFriendsResponse {
  result: number;
  friends: Friendship[];
}

export interface FriendshipOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface SearchUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface SearchUsersResponse {
  result: number;
  users: SearchUser[];
}

export interface SearchUsersParams {
  name: string;
  role?: string;
}

// Friends API Service
class FriendsService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Check if user has valid role for friendship operations
   */
  private hasValidRole(): boolean {
    const authStore = useAuthStore.getState();
    const role = authStore.getRole();
    return role === 'player' || role === 'coach' || role === 'parent';
  }

  /**
   * Send a friend request
   * POST /api/v1/friendship/friendRequest
   */
  async sendFriendRequest(data: SendFriendRequestRequest): Promise<FriendshipOperationResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const response = await axiosInstance.post<Friendship>(API_CONFIG.ENDPOINTS.FRIENDSHIP.FRIEND_REQUEST, data);
      
      return {
        success: true,
        message: 'Friend request sent successfully',
        data: response.data
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to send friend request');
    }
  }

  /**
   * Get friend requests
   * GET /api/v1/friendship/friendRequest
   */
  async getFriendRequests(params: PaginationParams = {}): Promise<FriendRequestsResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const url = `${API_CONFIG.ENDPOINTS.FRIENDSHIP.FRIEND_REQUEST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<FriendRequestsResponse>(url);
    
    return response.data;
  }

  /**
   * Get sent friend requests
   * GET /api/v1/friendship/sent
   */
  async getSentFriendRequests(params: PaginationParams = {}): Promise<FriendRequestsResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort) queryParams.append('sort', params.sort);

      // First try the dedicated sent endpoint
      try {
        const url = `${API_CONFIG.ENDPOINTS.FRIENDSHIP.SENT}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await axiosInstance.get<FriendRequestsResponse>(url);
        return response.data;
      } catch (error: any) {
        // If dedicated endpoint doesn't exist, fall back to filtering from general endpoint
        console.log('Dedicated sent endpoint not available, falling back to filtering');
        const allRequests = await this.getFriendRequests(params);
        
        // Filter for requests sent by current user
        const authStore = useAuthStore.getState();
        const currentUserId = authStore.user?._id;
        
        if (!currentUserId) {
          return { result: 0, friendRequests: [] };
        }

        const sentRequests = allRequests.friendRequests.filter(request => 
          request.user1._id === currentUserId && request.status === 'request'
        );

        return {
          result: sentRequests.length,
          friendRequests: sentRequests
        };
      }
    } catch (error: any) {
      console.error('Error getting sent friend requests:', error);
      throw error;
    }
  }

  /**
   * Accept friend request
   * PUT /api/v1/friendship/:id/accept
   */
  async acceptFriendRequest(friendshipId: string): Promise<FriendsListResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const response = await axiosInstance.put<FriendsListResponse>(API_CONFIG.ENDPOINTS.FRIENDSHIP.ACCEPT.replace(':id', friendshipId));
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to accept friend request');
    }
  }

  /**
   * Reject friend request
   * DELETE /api/v1/friendship/:id/reject
   */
  async rejectFriendRequest(friendshipId: string): Promise<FriendshipOperationResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const response = await axiosInstance.delete(API_CONFIG.ENDPOINTS.FRIENDSHIP.REJECT.replace(':id', friendshipId));
      
      return {
        success: true,
        message: 'Friend request rejected successfully',
        data: response.data
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to reject friend request');
    }
  }

  /**
   * Get friends list
   * GET /api/v1/friendship
   */
  async getFriendsList(params: PaginationParams = {}): Promise<FriendsListResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const url = `${API_CONFIG.ENDPOINTS.FRIENDSHIP.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<FriendsListResponse>(url);
    
    return response.data;
  }

  /**
   * Get blocked friends
   * GET /api/v1/friendship/blocked
   */
  async getBlockedFriends(params: PaginationParams = {}): Promise<BlockedFriendsResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const url = `${API_CONFIG.ENDPOINTS.FRIENDSHIP.BLOCKED}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get<BlockedFriendsResponse>(url);
    
    return response.data;
  }

  /**
   * Unfriend user
   * DELETE /api/v1/friendship/:id/unfriend
   */
  async unfriendUser(friendshipId: string): Promise<FriendsListResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const response = await axiosInstance.delete<FriendsListResponse>(API_CONFIG.ENDPOINTS.FRIENDSHIP.UNFRIEND.replace(':id', friendshipId));
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to unfriend user');
    }
  }

  /**
   * Block friend
   * PUT /api/v1/friendship/:id/block
   */
  async blockFriend(friendshipId: string): Promise<FriendsListResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const response = await axiosInstance.put<FriendsListResponse>(API_CONFIG.ENDPOINTS.FRIENDSHIP.BLOCK.replace(':id', friendshipId));
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to block friend');
    }
  }

  /**
   * Unblock friend
   * PUT /api/v1/friendship/:id/unblock
   */
  async unblockFriend(friendshipId: string): Promise<FriendsListResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const response = await axiosInstance.put<FriendsListResponse>(API_CONFIG.ENDPOINTS.FRIENDSHIP.UNBLOCK.replace(':id', friendshipId));
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to unblock friend');
    }
  }

  /**
   * Check if user can send friend requests
   */
  canSendFriendRequests(): boolean {
    return this.hasValidRole();
  }

  /**
   * Check if user can manage friendships
   */
  canManageFriendships(): boolean {
    return this.hasValidRole();
  }

  /**
   * Format friendship date for display
   */
  formatFriendshipDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Get user's current role
   */
  getUserRole(): string | null {
    const authStore = useAuthStore.getState();
    return authStore.getRole();
  }

  /**
   * Check if friendship is blocked
   */
  isFriendshipBlocked(friendship: Friendship, userId: string): boolean {
    if (friendship.user1._id === userId) {
      return friendship.user1IsBlocked;
    } else if (friendship.user2._id === userId) {
      return friendship.user2IsBlocked;
    }
    return false;
  }

  /**
   * Get the other user in a friendship
   */
  getOtherUser(friendship: Friendship, userId: string): FriendshipUser | null {
    if (friendship.user1._id === userId) {
      return friendship.user2;
    } else if (friendship.user2._id === userId) {
      return friendship.user1;
    }
    return null;
  }

  /**
   * Search for users by name or email
   * GET /api/v1/users/search
   */
  async searchUsers(params: SearchUsersParams): Promise<SearchUsersResponse> {
    if (!this.hasValidRole()) {
      throw new Error('Invalid role for this operation');
    }

    try {
      const queryParams = new URLSearchParams();
      
      // Use name parameter
      queryParams.append('name', params.name);
      
      if (params.role) queryParams.append('role', params.role);

      const url = `${API_CONFIG.ENDPOINTS.USERS.SEARCH}?${queryParams.toString()}`;
      const response = await axiosInstance.get<SearchUsersResponse>(url);
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to search users');
    }
  }

  /**
   * Check if user can send friend request to target user based on roles
   */
  canSendRequestToUser(targetRole: string): boolean {
    const userRole = this.getUserRole();
    
    if (!userRole) return false;
    
    // Players cannot send requests to parents/coaches
    if (userRole === 'player' && (targetRole === 'parent' || targetRole === 'coach')) {
      return false;
    }
    
    // Coaches cannot send requests to players
    if (userRole === 'coach' && targetRole === 'player') {
      return false;
    }
    
    // Parents cannot send requests to players
    if (userRole === 'parent' && targetRole === 'player') {
      return false;
    }
    
    return true;
  }
}

// Create and export instance
export const friendsService = new FriendsService();
