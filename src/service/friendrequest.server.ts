import axiosInstance from "@/config/axios.config";

// Types for Friend Request module based on API response
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  isOnline: boolean;
  avatar?: string;
}

export interface FriendRequest {
  _id: string;
  user1: User;
  user2: User;
  status: 'request' | 'friends' | 'rejected';
  friendRequestSentAt: string;
  notification: boolean;
  createdAt: string;
}

export interface FriendRequestListResponse {
  result: number;
  friendRequests: FriendRequest[];
}

export interface AcceptFriendRequestResponse {
  friendship: {
    result: number;
    friends: Array<{
      _id: string;
      user1: User;
      user2: User;
      status: 'friends';
      becameFriendsAt: string;
    }>;
  };
  players: {
    result: number;
    players: any[];
  };
  coaches: {
    result: number;
    coaches: any[];
  };
  parents: {
    result: number;
    parents: any[];
  };
}

export interface RejectFriendRequestResponse {
  acknowledged: boolean;
  deletedCount: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    status: number;
  };
}

// Friend Request API Service
class FriendRequestService {
  constructor() {
    // Authentication is handled automatically by axiosInstance interceptors
  }

  /**
   * Get all pending friend requests for the authenticated user
   * GET /friendship/friendRequest
   */
  async getFriendRequests(
    page: number = 1, 
    limit: number = 20, 
    sort: string = '-createdAt'
  ): Promise<FriendRequestListResponse> {
    try {
      const response = await axiosInstance.get<FriendRequestListResponse>('/api/v1/friendship/friendRequest', {
        params: { page, limit, sort }
      });
      
      console.log('Friend Requests API Response:', response.data);
      
      // Validate response structure
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getFriendRequests:', error);
      throw error;
    }
  }

  /**
   * Accept a pending friend request
   * PUT /friendship/:id/accept
   */
  async acceptFriendRequest(friendshipId: string): Promise<AcceptFriendRequestResponse> {
    try {
      const response = await axiosInstance.put<AcceptFriendRequestResponse>(`/api/v1/friendship/${friendshipId}/accept`);
      
      console.log('Accept Friend Request Response:', response.data);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Reject a pending friend request
   * DELETE /friendship/:id/reject
   */
  async rejectFriendRequest(friendshipId: string): Promise<RejectFriendRequestResponse> {
    try {
      const response = await axiosInstance.delete<RejectFriendRequestResponse>(`/api/v1/friendship/${friendshipId}/reject`);
      
      console.log('Reject Friend Request Response:', response.data);
      
      if (!response.data) {
        throw new Error('No data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }

  /**
   * Get friend requests count
   */
  async getFriendRequestsCount(): Promise<number> {
    try {
      const response = await this.getFriendRequests(1, 1);
      return response.result;
    } catch (error) {
      console.error('Error getting friend requests count:', error);
      return 0;
    }
  }

  /**
   * Get pending friend requests (status: 'request')
   */
  async getPendingFriendRequests(page: number = 1, limit: number = 20): Promise<FriendRequestListResponse> {
    try {
      const response = await this.getFriendRequests(page, limit, '-friendRequestSentAt');
      
      // Filter to only include pending requests
      const pendingRequests = response.friendRequests.filter(
        request => request.status === 'request'
      );
      
      return {
        result: pendingRequests.length,
        friendRequests: pendingRequests
      };
    } catch (error) {
      console.error('Error getting pending friend requests:', error);
      throw error;
    }
  }

  /**
   * Get user display name
   */
  getUserDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Get user initials
   */
  getUserInitials(user: User): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    
    return 'U';
  }

  /**
   * Get default avatar color based on user name
   */
  getDefaultAvatarColor(user: User): string {
    const name = this.getUserDisplayName(user);
    if (!name) return 'from-gray-400 to-gray-500';
    
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
      console.warn('Error getting avatar color:', error);
      return 'from-gray-400 to-gray-500';
    }
  }

  /**
   * Format date to relative time
   */
  formatRelativeTime(dateString: string): string {
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
      console.warn('Error formatting date:', error);
      return 'Unknown';
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(user: User): boolean {
    return user.isOnline || false;
  }

  /**
   * Get online status text
   */
  getOnlineStatusText(user: User): string {
    return this.isUserOnline(user) ? 'Online' : 'Offline';
  }

  /**
   * Get online status color class
   */
  getOnlineStatusColor(user: User): string {
    return this.isUserOnline(user) 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700';
  }

  /**
   * Transform friend request to display format
   */
  transformFriendRequestForDisplay(request: FriendRequest, currentUserId?: string) {
    // Determine which user is the other person (not the current user)
    const otherUser = request.user1._id === currentUserId ? request.user2 : request.user1;
    
    return {
      id: request._id,
      user: otherUser,
      displayName: this.getUserDisplayName(otherUser),
      initials: this.getUserInitials(otherUser),
      avatar: otherUser.avatar,
      avatarColor: this.getDefaultAvatarColor(otherUser),
      isOnline: this.isUserOnline(otherUser),
      onlineStatus: this.getOnlineStatusText(otherUser),
      onlineStatusColor: this.getOnlineStatusColor(otherUser),
      sentAt: request.friendRequestSentAt,
      sentAtFormatted: this.formatRelativeTime(request.friendRequestSentAt),
      notification: request.notification,
      createdAt: request.createdAt
    };
  }
}

// Create and export instance
export const friendRequestService = new FriendRequestService();
