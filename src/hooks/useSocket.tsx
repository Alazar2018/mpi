import { useChatStore, type Message } from '@/features/connect/store/chat.store';
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
    
    socket.on("new-message", (message: Message) => {
      chatStore.addMessage(message)
    });

    socket.on("online-users", (users: string[]) => {
      chatStore.setOnline(new Set(users))
    });

    socket.on("message-seen", (data = {}) => {
      console.log('seen', data)
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("new-message");
      socket.off("message-seen");
      socket.close();
    };
  }, [socket, chatStore]);

	return (
		<SC.Provider value={socket}>
			{children}
		</SC.Provider>
	)
}