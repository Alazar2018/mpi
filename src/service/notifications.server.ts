import axiosInstance from "@/config/axios.config";

// Types for Notifications module based on actual API response
export interface NotificationData {
  resourceId?: string;
  additionalId?: string;
  route?: string;
  imageUrl?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'match' | 'class' | 'friendship' | 'announcement' | 'user_added' | 'periodization' | 'comment' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
  data: NotificationData;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    match: number;
    class: number;
    friendship: number;
    announcement: number;
    user_added: number;
    periodization: number;
    comment: number;
  };
  byPriority: {
    normal: number;
    high: number;
    low: number;
  };
  deviceInfo: {
    totalActiveSessions: number;
    sessionsWithTokens: number;
    devicesEnabledForPush: number;
    deviceTypes: {
      mobile: number;
      desktop: number;
    };
  };
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  priority?: string;
  sort?: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  unreadCount: number;
  filters: {
    type: string | null;
    isRead: boolean | null;
    priority: string | null;
  };
}

export interface NotificationStatsResponse {
  success: boolean;
  stats: NotificationStats;
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  unreadCount: number;
  updateResult: {
    matchedCount: number;
    modifiedCount: number;
  };
}

export interface CreateNotificationRequest {
  message: string;
  title: string;
  type: string;
  priority?: 'low' | 'normal' | 'high';
  data?: NotificationData;
}

export interface CreateNotificationResponse {
  success: boolean;
  message: string;
  notification: Notification;
}

class NotificationsService {
  constructor() {
    // Authentication is now handled automatically by axiosInstance interceptors
  }

  /**
   * Get all notifications with filtering and pagination
   * GET /api/v1/notifications
   */
  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.sort) params.append('sort', filters.sort);

    const queryString = params.toString();
    const url = `/api/v1/notifications${queryString ? `?${queryString}` : ''}`;
    
    const response = await axiosInstance.get(url);
    
    // Transform the API response to match our interface
    // API returns: { status: "success", data: { notifications: [], unreadCount: 0, ... } }
    return {
      success: response.data.status === 'success',
      notifications: response.data.data.notifications || [],
      pagination: response.data.data.pagination || {},
      unreadCount: response.data.data.unreadCount || 0,
      filters: response.data.data.filters || {}
    };
  }

  /**
   * Get notification statistics
   * GET /api/v1/notifications/stats
   */
    async getNotificationStats(): Promise<NotificationStatsResponse> {
    try {
      const response = await axiosInstance.get('/api/v1/notifications/stats');
      
      // Handle different possible response structures
      let success = false;
      let stats = null;
      
      if (response.data) {
        // Try different response formats
        if (response.data.success !== undefined && response.data.stats) {
          // Format: { success: true, stats: {...} }
          success = response.data.success;
          stats = response.data.stats;
        } else if (response.data.status === 'success' && response.data.data) {
          // Format: { status: "success", data: {...} }
          success = true;
          stats = response.data.data;
        } else if (response.data.unreadCount !== undefined) {
          // Format: { unreadCount: 0, ... }
          success = true;
          stats = {
            unread: response.data.unreadCount || 0,
            total: response.data.totalCount || 0,
            read: (response.data.totalCount || 0) - (response.data.unreadCount || 0),
            byType: {
              match: 0,
              class: 0,
              friendship: 0,
              announcement: 0,
              user_added: 0,
              periodization: 0,
              comment: 0
            },
            byPriority: {
              normal: 0,
              high: 0,
              low: 0
            },
            deviceInfo: {
              totalActiveSessions: 0,
              sessionsWithTokens: 0,
              devicesEnabledForPush: 0,
              deviceTypes: {
                mobile: 0,
                desktop: 0
              }
            }
          };
        }
      }
      
      if (!success || !stats) {
        return {
          success: false,
          stats: {
            unread: 0,
            total: 0,
            read: 0,
            byType: {
              match: 0,
              class: 0,
              friendship: 0,
              announcement: 0,
              user_added: 0,
              periodization: 0,
              comment: 0
            },
            byPriority: {
              normal: 0,
              high: 0,
              low: 0
            },
            deviceInfo: {
              totalActiveSessions: 0,
              sessionsWithTokens: 0,
              devicesEnabledForPush: 0,
              deviceTypes: {
                mobile: 0,
                desktop: 0
              }
            }
          }
        };
      }
      
      return { success, stats };
    } catch (error) {
      return {
        success: false,
        stats: {
          unread: 0,
          total: 0,
          read: 0,
          byType: {
            match: 0,
            class: 0,
            friendship: 0,
            announcement: 0,
            user_added: 0,
            periodization: 0,
            comment: 0
          },
          byPriority: {
            normal: 0,
            high: 0,
            low: 0
          },
          deviceInfo: {
            totalActiveSessions: 0,
            sessionsWithTokens: 0,
            devicesEnabledForPush: 0,
            deviceTypes: {
              mobile: 0,
              desktop: 0
            }
          }
        }
      };
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read
   */
  async markAllAsRead(): Promise<MarkAsReadResponse> {
    const response = await axiosInstance.patch<MarkAsReadResponse>('/api/v1/notifications/read');
    return response.data;
  }

  /**
   * Mark specific notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(notificationId: string): Promise<MarkAsReadResponse> {
    const response = await axiosInstance.patch<MarkAsReadResponse>(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  }

  /**
   * Delete specific notification
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/api/v1/notifications/${notificationId}`);
    return response.data;
  }

  /**
   * Create new notification (for testing/admin purposes)
   * POST /api/v1/notifications
   */
  async createNotification(data: CreateNotificationRequest): Promise<CreateNotificationResponse> {
    const response = await axiosInstance.post<CreateNotificationResponse>('/api/v1/notifications', data);
    return response.data;
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      // Try to get from notifications list first (more reliable)
      const notifications = await this.getNotifications({ isRead: false, limit: 1 });
      return notifications.unreadCount || 0;
    } catch (error) {
      // Fallback to stats endpoint
      try {
        const stats = await this.getNotificationStats();
        return stats.stats?.unread || 0;
      } catch (statsError) {
        console.error('Failed to get unread count from both endpoints:', error, statsError);
        return 0;
      }
    }
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(type: string, limit: number = 20): Promise<Notification[]> {
    const response = await this.getNotifications({ type, limit, sort: '-createdAt' });
    return response.notifications;
  }

  /**
   * Get high priority notifications
   */
  async getHighPriorityNotifications(limit: number = 10): Promise<Notification[]> {
    const response = await this.getNotifications({ priority: 'high', limit, sort: '-createdAt' });
    return response.notifications;
  }

  /**
   * Get recent notifications (last 24 hours)
   */
  async getRecentNotifications(limit: number = 20): Promise<Notification[]> {
    const response = await this.getNotifications({ limit, sort: '-createdAt' });
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return response.notifications.filter(notification => 
      new Date(notification.createdAt) > oneDayAgo
    );
  }

  /**
   * Check if user has any unread notifications
   */
  async hasUnreadNotifications(): Promise<boolean> {
    const unreadCount = await this.getUnreadCount();
    return unreadCount > 0;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<Notification | null> {
    try {
      const response = await this.getNotifications({ limit: 1000 });
      const notification = response.notifications.find(n => n._id === notificationId);
      return notification || null;
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      return null;
    }
  }
}

// Create and export instance
export const notificationsService = new NotificationsService();
