import { useState, useEffect, useRef } from "react";
import icons from "@/utils/icons";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import { generateAvatar } from "@/utils/avatar";
import { useNavigate } from "react-router";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { notificationsService } from "@/service/notifications.server";
import ConnectModal from "./ConnectModal";

interface HeaderProps {
    setMobileMenuOpen?: (open: boolean) => void;
    mobileMenuOpen?: boolean;  // Add this line
}

export default function Header({ setMobileMenuOpen, mobileMenuOpen = false }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();
    const navigate = useNavigate();
    const notificationRef = useRef<HTMLDivElement>(null);
    
    // Initialize notification socket
    useNotificationSocket();

    // Fetch notifications on mount
    useEffect(() => {
        notificationStore.fetchNotifications();
        notificationStore.syncWithAPI();
    }, []);

    // Refresh user avatar on mount to ensure it's up to date
    useEffect(() => {
        if (authStore.user && !authStore.user.avatar) {
            // Only refresh if user exists but has no avatar
            authStore.refreshUser().catch(err => {
                console.log("Avatar refresh failed (non-critical):", err);
            });
        }
    }, [authStore.user]);

    // Handle click outside notifications dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    // Apply dark mode class on mount and when isDarkMode changes
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (localStorage.getItem('darkMode') === null) {
                // Only auto-update if user hasn't manually set a preference
                setIsDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Searching for:", searchQuery);
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
        
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleConnect = () => {
        setShowConnectModal(true);
    };

    const handleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const handleSettings = () => {
        setShowSettings(!showSettings);
    };

    const handleProfile = () => {
        // Refresh user avatar before navigating to profile to ensure it's up to date
        authStore.refreshUser().catch(err => {
            console.log("Avatar refresh failed (non-critical):", err);
        });
        navigate("/admin/profile");
    };

    const handleNotificationClick = async (notification: any) => {
        await notificationStore.markAsRead(notification.id);
        // Navigate to notifications page to see full details
        navigate("/admin/notifications");
        setShowNotifications(false);
    };

    const handleMarkAllAsRead = async () => {
        await notificationStore.markAllAsRead();
    };

    const handleClearAll = () => {
        notificationStore.clearAll();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return icons.check;
            case 'warning':
                return icons.bell;
            case 'error':
                return icons.close;
            default:
                return icons.bell;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
            case 'warning':
                return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
            case 'error':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
            default:
                return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    const formatTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const userAvatar = authStore.user?.avatar
        ? (typeof authStore.user.avatar === 'string' ? authStore.user.avatar : generateAvatar({ name: authStore.user?.firstName || "User" }))
        : generateAvatar({ name: authStore.user?.firstName || "User" });

    return (
        <div className="bg-[var(--bg-header)] rounded-3xl w-full h-[68px] flex items-center justify-between md:justify-end gap-4 md:gap-8 px-4 md:px-8 shadow-[var(--shadow-primary)] transition-colors duration-300">
            {/* Mobile menu button (hidden on desktop) */}
            <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen?.(!mobileMenuOpen)} // Changed from prev=>!prev to !mobileMenuOpen
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
                <i
                    className="*:size-6"
                    dangerouslySetInnerHTML={{
                        __html: mobileMenuOpen ? icons.close : icons.menu
                    }}
                />
            </button>

            {/* Search Bar - hidden on small screens */}
            <div className="hidden md:block w-[200px] lg:w-[460px] mr-4">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-1.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                    />
                                         <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                         <i
                             className="*:size-3.5 text-[var(--text-tertiary)] flex-end"
                             dangerouslySetInnerHTML={{ __html: icons.search }}
                         />
                     </div>
                </form>
            </div>

            {/* Action Items */}
            <div className="flex items-center py-8 gap-4 md:gap-7">
                {/* Connect Button - hidden on mobile */}
                <button
                    onClick={handleConnect}
                    className="hidden sm:block p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors bg-[var(--bg-tertiary)] transition-all duration-300"
                    title="Connect"
                >
                                         <i
                         className="*:size-4 text-[var(--text-secondary)]"
                         dangerouslySetInnerHTML={{ __html: icons.users }}
                     />
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={handleNotifications}
                        className="p-1.5 rounded-l hover:bg-[var(--bg-secondary)] transition-colors relative bg-[var(--bg-tertiary)] transition-all duration-300"
                        title="Notifications"
                    >
                                                 <i
                             className="*:size-4 text-[var(--text-secondary)]"
                             dangerouslySetInnerHTML={{ __html: icons.bell }}
                         />
                        {notificationStore.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                    {notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount}
                                </span>
                            </div>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-dropdown)] rounded-xl shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] z-50 max-h-[500px] overflow-hidden transition-colors duration-300">
                            <div className="p-4 border-b border-[var(--border-secondary)] flex justify-between items-center">
                                <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
                                <div className="flex space-x-2">
                                                                         <button
                                         onClick={handleMarkAllAsRead}
                                         className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                     >
                                         Mark all read
                                     </button>
                                     <button
                                         onClick={handleClearAll}
                                         className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                     >
                                         Clear all
                                     </button>
                                </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notificationStore.notifications.length === 0 ? (
                                                                         <div className="p-4 text-center text-[var(--text-tertiary)]">
                                         <i 
                                             className="mx-auto mb-2 block text-2xl text-[var(--text-tertiary)]"
                                             dangerouslySetInnerHTML={{ __html: icons.bell }}
                                         />
                                         <p className="text-sm text-[var(--text-secondary)]">No notifications</p>
                                     </div>
                                ) : (
                                    notificationStore.notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors ${
                                                !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                                    <i 
                                                        className="text-sm"
                                                        dangerouslySetInnerHTML={{ __html: getNotificationIcon(notification.type) }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-[var(--text-tertiary)]">
                                                            {formatTimeAgo(notification.timestamp)}
                                                        </span>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* See All Notifications Button - Now at the bottom */}
                            <div className="p-3 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
                                <button
                                    onClick={() => {
                                        navigate("/admin/notifications");
                                        setShowNotifications(false);
                                    }}
                                                                         className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    See All Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="p-1.5 rounded-l hover:bg-[var(--bg-secondary)] transition-colors bg-[var(--bg-tertiary)] transition-all duration-300"
                    title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                                         <i
                         className="*:size-4 text-[var(--text-secondary)]"
                         dangerouslySetInnerHTML={{
                             __html: isDarkMode
                                 ? icons.sun
                                 : icons.moon
                         }}
                     />
                </button>

                {/* Settings */}
                <div className="relative">
                    <button
                        onClick={handleSettings}
                        className="p-1.5 rounded-l hover:bg-[var(--bg-secondary)] transition-colors bg-[var(--bg-tertiary)] transition-all duration-300"
                        title="Settings"
                    >
                                                 <i
                             className="*:size-4 text-[var(--text-secondary)]"
                             dangerouslySetInnerHTML={{ __html: icons.settings }}
                         />
                    </button>

                    {showSettings && (
                        <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-dropdown)] rounded-xl shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] z-50 transition-colors duration-300">
                            <div className="p-4 border-b border-[var(--border-secondary)]">
                                <h3 className="font-semibold text-[var(--text-primary)]">Settings</h3>
                            </div>
                            <div className="p-2">
                                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] transition-colors duration-300">
                                    Account Settings
                                </button>
                                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] transition-colors duration-300">
                                    Privacy
                                </button>
                                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] transition-colors duration-300">
                                    Help & Support
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <button
                    onClick={handleProfile}
                    className="relative p-1.5 rounded-l"
                    title="Profile"
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--border-primary)] hover:border-primary transition-colors">
                        <img
                            src={userAvatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </button>
            </div>
        
    
        {/* Connect Modal */}
        <ConnectModal 
            isOpen={showConnectModal} 
            onClose={() => setShowConnectModal(false)} 
        />
        </div>
    );
}