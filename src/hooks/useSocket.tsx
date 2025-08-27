import { useChatStore } from '@/features/connect/store/chat.store';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client'

const SC = createContext<Socket | null>(null);
export const useChatSocket = () => useContext(SC);

export interface TypingUser {
  chatId: string;
  userId: string;
}

export function ChatSocketProvider({ children }: { children: React.ReactNode }){
  const chatStore = useChatStore()
	const socket = useMemo(() => io('http://46.202.93.201:4000', {
    autoConnect: true,
    reconnection: true,
    transports: ['websocket']
  }), []);

	useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on("typing", (data: TypingUser) => {
      chatStore.setTyping(chatStore.typing.add(data.userId))
    });

    socket.on("stop-typing", (data: TypingUser) => {
      chatStore.typing.delete(data.userId)
      chatStore.setTyping(chatStore.typing)
    });
    
    socket.on("new-message", (data: any) => {
      console.log('New message received via socket:', data);
      
      // Convert socket message to the format expected by chat store
      const message = {
        senderId: data.senderId || data.sender?._id,
        chatId: data.chatId || data.chat?._id,
        content: data.content || data.message
      };
      
      // Add message to chat store
      chatStore.addMessage(message);
      
      // If this is the currently selected chat, mark it as read automatically
      if (chatStore.selectedChat && chatStore.selectedChat._id === message.chatId) {
        // Mark message as read automatically when chat is open
        socket.emit('mark-message-read', {
          messageId: data._id || data.messageId,
          chatId: message.chatId
        });
        
        // Also mark all messages in this chat as read in the store
        chatStore.markAllMessagesAsRead(message.chatId);
      }
    });

    socket.on("online-users", (users: string[]) => {
      chatStore.setOnline(new Set(users))
    });

    socket.on("message-seen", (data = {}) => {
      console.log('Message seen:', data);
      // Update message read status in store
      if (data.messageId && data.chatId) {
        // Update the message read status in the store
        const chat = chatStore.chats.find(c => c._id === data.chatId);
        if (chat) {
          // Mark message as read in the store
          chatStore.updateMessageReadStatus(data.messageId, data.chatId, true);
        }
      }
    });

    // Handle when a message is sent by the current user
    socket.on("message-sent", (data: any) => {
      console.log('Message sent confirmation:', data);
      // Update the message in the store if needed
      if (data.messageId && data.chatId) {
        // The message is already in the store, but we can update its status
        // or trigger a refresh if needed
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("new-message");
      socket.off("message-seen");
      socket.off("message-sent");
      socket.close();
    };
  }, [socket, chatStore]);

	return (
		<SC.Provider value={socket}>
			{children}
		</SC.Provider>
	)
}