import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/store/notification.store';
import { WEBSOCKET_CONFIG, isWebSocketAvailable } from '@/config/websocket.config';

export function useNotificationSocket() {
  const notificationStore = useNotificationStore();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socket = useMemo(() => {
    if (!isWebSocketAvailable()) {
      return null;
    }
    
    try {
      return io(WEBSOCKET_CONFIG.URL, {
        ...WEBSOCKET_CONFIG.CONNECTION,
        query: WEBSOCKET_CONFIG.QUERY,
      });
    } catch (error) {
      setConnectionError('Failed to create WebSocket connection');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!socket || !isWebSocketAvailable()) {
      return;
    }

    // Manual connection - only connect when needed
    const connectSocket = () => {
      if (!socket.connected) {
        socket.connect();
      }
    };

    // Try to connect after a short delay
    const connectionTimer = setTimeout(connectSocket, 1000);

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      
      // Subscribe to notification channels
      socket.emit('subscribe', {
        channels: ['calendar', 'matches', 'training', 'system']
      });
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
    });

    socket.on('reconnect_failed', () => {
      setConnectionError('Failed to reconnect to WebSocket server');
    });

    // Calendar refresh event - triggers calendar data refresh
    socket.on('calendar-refresh', (data) => {
      // Emit a custom event that the calendar component can listen to
      window.dispatchEvent(new CustomEvent('calendar-refresh-requested', { detail: data }));
    });

    // Calendar event updates
    socket.on('calendar:event-created', (data) => {
      notificationStore.handleCalendarUpdate({ event: data.event, action: 'created' });
    });

    socket.on('calendar:event-updated', (data) => {
      notificationStore.handleCalendarUpdate({ event: data.event, action: 'updated' });
    });

    socket.on('calendar:event-cancelled', (data) => {
      notificationStore.handleCalendarUpdate({ event: data.event, action: 'cancelled' });
    });

    socket.on('calendar:event-reminder', (data) => {
      notificationStore.handleCalendarUpdate({ 
        event: data.event, 
        action: 'reminder',
        timeUntil: data.timeUntil 
      });
    });

    // Match updates
    socket.on('match:scheduled', (data) => {
      notificationStore.handleMatchUpdate({ match: data.match, action: 'scheduled' });
    });

    socket.on('match:updated', (data) => {
      notificationStore.handleMatchUpdate({ match: data.match, action: 'updated' });
    });

    socket.on('match:cancelled', (data) => {
      notificationStore.handleMatchUpdate({ match: data.match, action: 'cancelled' });
    });

    socket.on('match:reminder', (data) => {
      notificationStore.handleMatchUpdate({ 
        match: data.match, 
        action: 'reminder',
        timeUntil: data.timeUntil 
      });
    });

    // Generic webhook notifications
    socket.on('webhook:notification', (data) => {
      notificationStore.handleWebhookNotification(data);
    });

    // Training updates
    socket.on('training:scheduled', (data) => {
      notificationStore.addNotification({
        title: 'New Training Session',
        message: `"${data.training.title}" has been scheduled`,
        type: 'success',
        source: 'training',
        sourceId: data.training.id,
        actionUrl: `/training/${data.training.id}`,
        metadata: { training: data.training, action: 'scheduled' },
      });
    });

    socket.on('training:reminder', (data) => {
      notificationStore.addNotification({
        title: 'Training Reminder',
        message: `"${data.training.title}" starts in ${data.timeUntil || 'soon'}`,
        type: 'info',
        source: 'training',
        sourceId: data.training.id,
        actionUrl: `/training/${data.training.id}`,
        metadata: { training: data.training, action: 'reminder' },
      });
    });

    // System notifications
    socket.on('system:maintenance', (data) => {
      notificationStore.addNotification({
        title: 'System Maintenance',
        message: data.message || 'System will be under maintenance',
        type: 'warning',
        source: 'system',
        metadata: { maintenance: data },
      });
    });

    socket.on('system:update', (data) => {
      notificationStore.addNotification({
        title: 'System Update',
        message: data.message || 'System has been updated',
        type: 'info',
        source: 'system',
        metadata: { update: data },
      });
    });

    return () => {
      clearTimeout(connectionTimer);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect_attempt');
      socket.off('reconnect_failed');
      socket.off('calendar-refresh');
      socket.off('calendar:event-created');
      socket.off('calendar:event-updated');
      socket.off('calendar:event-cancelled');
      socket.off('calendar:event-reminder');
      socket.off('match:scheduled');
      socket.off('match:updated');
      socket.off('match:cancelled');
      socket.off('match:reminder');
      socket.off('webhook:notification');
      socket.off('training:scheduled');
      socket.off('training:reminder');
      socket.off('system:maintenance');
      socket.off('system:update');
      
      if (socket.connected) {
        socket.close();
      }
    };
  }, [socket, isWebSocketAvailable]);

  return { socket, isConnected, connectionError };
}
