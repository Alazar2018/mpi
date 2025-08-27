import { create } from 'zustand';
import { notificationsService } from '@/service/notifications.server';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
  source: 'calendar' | 'match' | 'training' | 'system';
  sourceId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API sync methods
  fetchNotifications: () => Promise<void>;
  syncWithAPI: () => Promise<void>;
  
  // WebSocket handlers
  handleWebhookNotification: (data: any) => void;
  handleCalendarUpdate: (data: any) => void;
  handleMatchUpdate: (data: any) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Auto-remove notifications after 30 seconds (except errors)
    if (notification.type !== 'error') {
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, 30000);
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  // API sync methods
  fetchNotifications: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await notificationsService.getNotifications({ limit: 50 });
      const apiNotifications = response.notifications;
      
      // Convert API notifications to store format
      const storeNotifications: Notification[] = apiNotifications.map(apiNotif => ({
        id: apiNotif._id,
        title: apiNotif.title,
        message: apiNotif.message,
        type: apiNotif.type === 'match' ? 'success' : 
              apiNotif.type === 'class' ? 'info' : 
              apiNotif.type === 'friendship' ? 'success' : 
              apiNotif.type === 'announcement' ? 'warning' : 'info',
        timestamp: new Date(apiNotif.createdAt),
        isRead: apiNotif.isRead,
        source: apiNotif.type === 'match' ? 'match' : 
                apiNotif.type === 'class' ? 'training' : 
                apiNotif.type === 'friendship' ? 'system' : 
                apiNotif.type === 'announcement' ? 'system' : 'system',
        sourceId: apiNotif._id,
        actionUrl: apiNotif.data?.route,
        metadata: apiNotif.data
      }));
      
      set({ 
        notifications: storeNotifications, 
        unreadCount: response.unreadCount,
        isLoading: false 
      });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch notifications',
        isLoading: false 
      });
    }
  },

  syncWithAPI: async () => {
    try {
      const response = await notificationsService.getNotificationStats();
      
      // Safely access the stats object
      if (response && response.success && response.stats) {
        set({ unreadCount: response.stats.unread || 0 });
      } else {
        set({ unreadCount: 0 });
      }
    } catch (err) {
      // Set unread count to 0 on error to prevent UI issues
      set({ unreadCount: 0 });
    }
  },

  // WebSocket handlers
  handleWebhookNotification: (data) => {
    const { type, title, message, source, sourceId, actionUrl, metadata } = data;
    
    get().addNotification({
      title: title || 'New Notification',
      message: message || 'You have a new notification',
      type: type || 'info',
      source: source || 'system',
      sourceId,
      actionUrl,
      metadata,
    });
  },

  handleCalendarUpdate: (data) => {
    const { event, action } = data;
    
    let title = '';
    let message = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (action) {
      case 'created':
        title = 'New Calendar Event';
        message = `"${event.title}" has been added to your calendar`;
        type = 'success';
        break;
      case 'updated':
        title = 'Calendar Event Updated';
        message = `"${event.title}" has been updated`;
        type = 'info';
        break;
      case 'cancelled':
        title = 'Calendar Event Cancelled';
        message = `"${event.title}" has been cancelled`;
        type = 'warning';
        break;
      case 'reminder':
        title = 'Event Reminder';
        message = `"${event.title}" starts in ${data.timeUntil || 'soon'}`;
        type = 'info';
        break;
    }

    get().addNotification({
      title,
      message,
      type,
      source: 'calendar',
      sourceId: event.id,
      actionUrl: `/calendar?event=${event.id}`,
      metadata: { event, action },
    });
  },

  handleMatchUpdate: (data) => {
    const { match, action } = data;
    
    let title = '';
    let message = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (action) {
      case 'scheduled':
        title = 'New Match Scheduled';
        message = `Match against ${match.opponentName || 'opponent'} has been scheduled`;
        type = 'success';
        break;
      case 'updated':
        title = 'Match Updated';
        message = `Match details have been updated`;
        type = 'info';
        break;
      case 'cancelled':
        title = 'Match Cancelled';
        message = `Match has been cancelled`;
        type = 'warning';
        break;
      case 'reminder':
        title = 'Match Reminder';
        message = `Your match starts in ${data.timeUntil || 'soon'}`;
        type = 'info';
        break;
    }

    get().addNotification({
      title,
      message,
      type,
      source: 'match',
      sourceId: match.id,
      actionUrl: `/matches/${match.id}`,
      metadata: { match, action },
    });
  },
}));
