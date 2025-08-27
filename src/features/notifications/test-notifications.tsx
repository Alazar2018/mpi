import { useState } from 'react';
import { notificationsService } from '@/service/notifications.server';

export default function TestNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createTestNotification = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    try {
      await notificationsService.createNotification({
        message: message,
        title: 'Test Notification',
        type: 'general',
        priority: 'normal',
        data: {
          route: '/notifications',
          imageUrl: ''
        }
      });
      
      setMessage('');
      alert('Test notification created successfully!');
    } catch (error) {
      console.error('Error creating test notification:', error);
      alert('Failed to create test notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Test Notification</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        
        <button
          onClick={createTestNotification}
          disabled={isLoading || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Test Notification'}
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> This creates a real notification in the system. 
          Use it to test the notifications functionality.
        </p>
      </div>
    </div>
  );
}
