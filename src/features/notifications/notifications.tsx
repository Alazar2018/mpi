import { useState, useEffect } from 'react';
import { notificationsService } from '@/service/notifications.server';
import type { Notification, NotificationFilters } from '@/service/notifications.server';
import { useNavigate } from 'react-router-dom';
import icons from '@/utils/icons';


interface NotificationsPageProps {
  // Add any props if needed
}

export default function NotificationsPage({}: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
    sort: '-createdAt'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showRead, setShowRead] = useState<boolean | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await notificationsService.getNotifications(filters);
      
      // Add safety checks for the response
      if (response && response.success && response.notifications) {
        setNotifications(response.notifications);
        setPagination(response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalNotifications: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 20
        });
        setUnreadCount(response.unreadCount || 0);
      } else {
        // Handle unexpected response structure
        console.warn('Unexpected response structure:', response);
        setNotifications([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalNotifications: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 20
        });
        setUnreadCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
      // Set default values on error
      setNotifications([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalNotifications: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 20
      });
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await notificationsService.getNotificationStats();
      // Handle both response formats
      if (stats && stats.success && stats.stats) {
        setUnreadCount(stats.stats.unread || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      // Refresh pagination
      if (notifications.length === 1 && filters.page && filters.page > 1) {
        setFilters(prev => ({ ...prev, page: prev.page! - 1 }));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleFilterChange = (newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.data?.route) {
      navigate(notification.data.route);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return icons.trophy;
      case 'class':
        return icons.book;
      case 'friendship':
        return icons.users;
      case 'announcement':
        return icons.bell;
      case 'user_added':
        return icons.userPlus;
      case 'periodization':
        return icons.calendar;
      case 'comment':
        return icons.message;
      default:
        return icons.bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
             case 'match':
         return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
       case 'class':
         return 'text-green-600 bg-green-50 dark:bg-green-900/20';
       case 'friendship':
         return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
       case 'announcement':
         return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
       case 'user_added':
         return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20';
       case 'periodization':
         return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
             case 'comment':
         return 'text-pink-600 bg-pink-50 dark:bg-pink-900/20';
       default:
         return 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
             case 'high':
         return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
       case 'normal':
         return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
             case 'low':
         return 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-[var(--border-secondary)]';
       default:
         return 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-[var(--border-secondary)]';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = (notifications || []).filter(notification => {
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    if (selectedPriority !== 'all' && notification.priority !== selectedPriority) return false;
    if (showRead !== null && notification.isRead !== showRead) return false;
    return true;
  });

  if (isLoading && (!notifications || notifications.length === 0)) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-4 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] p-6 transition-colors duration-300">
            <div className="animate-pulse">
                             <div className="h-8 bg-[var(--bg-tertiary)] rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

     return (
     <div className="min-h-screen bg-[var(--bg-primary)] p-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] p-6 mb-6 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
              <p className="text-[var(--text-secondary)] mt-1">
                {unreadCount} unread • {pagination.totalNotifications} total
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark All as Read
              </button>
            </div>
          </div>
        </div>



        {/* Filters */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] p-6 mb-6 transition-colors duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors duration-300"
              >
                <option value="all">All Types</option>
                <option value="match">Match</option>
                <option value="class">Class</option>
                <option value="friendship">Friendship</option>
                <option value="announcement">Announcement</option>
                <option value="user_added">User Added</option>
                <option value="periodization">Periodization</option>
                <option value="comment">Comment</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors duration-300"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Status</label>
              <select
                value={showRead === null ? 'all' : showRead ? 'read' : 'unread'}
                onChange={(e) => {
                  const value = e.target.value;
                  setShowRead(value === 'all' ? null : value === 'read');
                }}
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors duration-300"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Sort</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors duration-300"
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="-priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] overflow-hidden transition-colors duration-300">
          {error && (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-2">
                <i className="text-2xl" dangerouslySetInnerHTML={{ __html: icons.close }} />
              </div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!error && filteredNotifications.length === 0 && !isLoading && (
            <div className="p-12 text-center">
                          <div className="text-[var(--text-tertiary)] mb-4">
              <i className="text-6xl" dangerouslySetInnerHTML={{ __html: icons.bell }} />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No notifications found</h3>
            <p className="text-[var(--text-secondary)]">Try adjusting your filters or check back later.</p>
            </div>
          )}

          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-6 border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)] transition-colors duration-300 ${
                !notification.isRead ? 'bg-[var(--bg-secondary)] border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Notification Icon */}
                <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                  <i 
                    className="text-lg"
                    dangerouslySetInnerHTML={{ __html: getNotificationIcon(notification.type) }}
                  />
                </div>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                             New
                           </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {/* Notification Metadata */}
                      <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                        <span className={`px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                                                     className="p-2 text-blue-600 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors duration-300"
                          title="Mark as read"
                        >
                          <i className="text-sm" dangerouslySetInnerHTML={{ __html: icons.check }} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification._id)}
                                                 className="p-2 text-red-600 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors duration-300"
                        title="Delete notification"
                      >
                        <i className="text-sm" dangerouslySetInnerHTML={{ __html: icons.trash }} />
                      </button>
                    </div>
                  </div>

                  {/* Clickable area for navigation */}
                  {notification.data?.route && (
                    <button
                      onClick={() => handleNotificationClick(notification)}
                                             className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                    >
                      View Details →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] p-6 mt-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-primary)]">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalNotifications)} of{' '}
                {pagination.totalNotifications} notifications
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 text-sm border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 bg-[var(--bg-card)] text-[var(--text-primary)]"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-[var(--text-primary)]">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 text-sm border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 bg-[var(--bg-card)] text-[var(--text-primary)]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
