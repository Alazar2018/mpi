// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  // WebSocket server URL - update this to your actual server
  URL: import.meta.env.VITE_WEBSOCKET_URL || 'http://46.202.93.201:4000',
  
  // Enable/disable WebSocket functionality
  ENABLED: true, // Enabled for notifications
  
  // Connection settings
  CONNECTION: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 2,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
  },
  
  // Query parameters for connection
  QUERY: {
    type: 'notifications',
    userId: 'current-user-id', // TODO: Get from auth store
  },
  
  // Notification channels to subscribe to
  CHANNELS: ['calendar', 'matches', 'training', 'system'],
};

// Helper function to check if WebSocket is available
export const isWebSocketAvailable = () => {
  return WEBSOCKET_CONFIG.ENABLED && typeof window !== 'undefined' && 'WebSocket' in window;
};

// Helper function to get WebSocket status message
export const getWebSocketStatusMessage = (isConnected: boolean, error: string | null) => {
  if (!WEBSOCKET_CONFIG.ENABLED) {
    return 'WebSocket is disabled';
  }
  
  if (error) {
    return `Connection error: ${error}`;
  }
  
  if (isConnected) {
    return 'Connected to notification server';
  }
  
  return 'Connecting to notification server...';
};
