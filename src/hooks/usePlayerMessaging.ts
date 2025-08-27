import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from './useChat';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';

export const usePlayerMessaging = () => {
  const navigate = useNavigate();
  const { createDirectChat, selectChat } = useChat({ autoRefresh: false });
  const { user } = useAuthStore();



  // Send message to player - either create new chat or navigate to existing
  const sendMessageToPlayer = useCallback(async (playerId: string, playerName: string) => {
    if (!user?._id) {
      toast.error('You must be logged in to send messages');
      return;
    }

    try {
      // Create new direct chat (the system will handle existing chats automatically)
      const newChat = await createDirectChat(playerId);
      
      // Navigate to messages page
      navigate(`/admin/connect`);
      
      // Select the new chat in the useChat hook
      selectChat(newChat);
      
      toast.success(`Chat opened with ${playerName}`);
    } catch (error) {
      console.error('Failed to send message to player:', error);
      toast.error('Failed to create chat. Please try again.');
    }
  }, [user?._id, navigate, createDirectChat, selectChat]);



  return {
    sendMessageToPlayer
  };
};
