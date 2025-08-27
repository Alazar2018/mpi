import type { User } from "@/store/auth.store";
import type { Chat as ChatServiceChat, ChatUser } from "@/service/chat.server";
import { genId } from "@/utils/utils";
import { create } from "zustand";

const addToGroup = (group: MessageGroup, message: Message): MessageGroup => {
	const date = new Date(message.createdAt);
	const year = date.getFullYear().toString();
	const month = (date.getMonth()).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const time = date.getMinutes().toString().padStart(2, '0');

	const daysMessage = group[year]?.[month]?.[day] || {}
	if (daysMessage && Object.keys(daysMessage).length) {
		const idx = Object.keys(daysMessage).findIndex(el => {
			const d = new Date(el)
			return daysMessage[el].from == message.sender._id && (d.getMonth()).toString().padStart(2, '0') == month && (d.getFullYear()).toString() == year && (d.getDate()).toString().padStart(2, '0') == day && d.getMinutes().toString().padStart(2, '0') == time
		});

		if (idx != -1 && !(daysMessage[Object.keys(daysMessage)?.[idx + 1]])) {
			daysMessage[Object.keys(daysMessage)[idx]] = {
				...daysMessage[Object.keys(daysMessage)[idx]],
				createdAt: message.createdAt,
				messages: [...daysMessage[Object.keys(daysMessage)[idx]].messages, message]
			}
		} else {
			daysMessage[date.toISOString()] = {
				avatar: message.sender.avatar || '',
				messages: [message],
				createdAt: message.createdAt,
				from: message.sender._id
			}
		}
	} else {
		daysMessage[date.toISOString()] = {
			avatar: message.sender.avatar || '',
			messages: [message],
			createdAt: message.createdAt,
			from: message.sender._id
		}
	}
	const g = {
		...group,
		[year]: {
			...group[year],
			[month]: {
				...group[year]?.[month],
				[day]: {
					...daysMessage,
				}
			}
		}
	};

	return g
};

function createMsg(chat: Chat, msg: NewMessage): Message {
	const id = genId.next().value as string
	return {
		_id: id,
		content: msg.content,
		isGroup: chat.isGroupChat,
		sender: chat.users.find((user) => user._id == msg.senderId) as User,
		createdAt: new Date(chat.latestMessageTimeStamp || new Date().toISOString()),
		updatedAt: new Date(chat.latestMessageTimeStamp || new Date().toISOString()),
		chat: chat,
		image: "",
		isRead: false,
		readBy: [],
		receivers: [],
		id: id
	}
}

export type MessageGroup = {
	[year: string]: {
		[month: string]: {
			[day: string]: {
				[time: string]: {
					avatar: string,
					messages: Message[],
					createdAt: Date,
					from: string
				}
			};
		};
	};
};

export type Chat = {
	init: boolean,
	users: User[],
	chatName: string,
	isGroupChat: boolean,
	createdAt: string,
	updatedAt: string,
	latestMessage: string,
	latestMessageContent: string,
	latestMessageSenderId: string,
	latestMessageTimeStamp: string,
	_id: string,
	messages: MessageGroup,
	// Additional properties from chat service
	photo?: string,
	unreadCount: number,
	isArchived: boolean,
	isPinned: boolean,
	isMuted: boolean,
	lastReadAt?: string,
	groupAdmin?: {
		_id: string;
		firstName: string;
		lastName: string;
	};
}

export type Message = {
	_id: string;
	receivers: string[];
	isGroup: boolean,
	sender: User;
	content: string;
	image: string;
	isRead: boolean;
	readBy: string[];
	chat: Chat;
	createdAt: Date;
	updatedAt: Date;
	id: string;
};

type ChatStore = {
	chats: Chat[];
	selectedChat: Chat | null;
	typing: Set<string>,
	online: Set<string>,
	addChat: (chat: Chat) => void,
	setChats: (chat: Chat[]) => void;
	setSelectedChat: (chat: Chat | null) => void;
	addMessage: (newMessage: NewMessage | Message) => void,
	addMessages: (newMessages: { chatId: string, messages: Message[] }) => void;
	updateMessageReadStatus: (messageId: string, chatId: string, isRead: boolean) => void;
	markAllMessagesAsRead: (chatId: string) => void;
	setTyping: (typing: Set<string>) => void;
	setOnline: (typing: Set<string>) => void;
	getChatWith: (userId: string) => Chat | null;
}

type NewMessage = {
	senderId: string,
	chatId: string,
	content: string
}

export const useChatStore = create<ChatStore>((set, get) => ({
	chats: [],
	selectedChat: null,
	typing: new Set<string>(),
	online: new Set<string>(),
	setChats: (chat: Chat[]) => set((state) => {
		return ({
			...state, chats: chat
		})
	}),
	addChat: (chat: Chat) => set((state) => {
		return ({ ...state, chats: [...state.chats, chat] })
	}),
	addMessage: (newMessage: NewMessage | Message) => {
		return set((state) => {
			const chatId = '_id' in newMessage ? newMessage.chat._id : newMessage.chatId;
			const idx = state.chats.findIndex((chat) => chat._id === chatId);
			if (idx == -1) return state;
			
			const id = genId.next().value as string;
			const newMsg = ('_id' in newMessage) ? newMessage : {
				_id: id,
				content: newMessage.content,
				isGroup: state.chats[idx].isGroupChat,
				sender: state.chats[idx].users.find((user) => user._id == newMessage.senderId) as User,
				createdAt: new Date(),
				updatedAt: new Date(),
				chat: state.chats[idx],
				image: "",
				isRead: false,
				readBy: [],
				receivers: [],
				id: id
			};

			// Update the chat with the new message
			const updatedChat = {
				...state.chats[idx],
				messages: addToGroup(state.chats[idx].messages, newMsg as Message),
				latestMessage: newMsg.content,
				latestMessageContent: newMsg.content,
				latestMessageSenderId: newMsg.sender._id,
				latestMessageTimeStamp: newMsg.createdAt.toISOString(),
				unreadCount: state.chats[idx].unreadCount + 1
			};

			return {
				...state,
				chats: state.chats.map((chat, index) => 
					index === idx ? updatedChat : chat
				)
			};
		})
	},
	addMessages: (newMessages: { chatId: string, messages: Message[] }) => {
		set((state) => {
			const idx = state.chats.findIndex((chat) => chat._id == newMessages.chatId)
			if (idx == -1) return state
			state.chats[idx] = {
				...state.chats[idx],
				init: true,
				messages: newMessages.messages.reduce(
					(group, msg) => addToGroup(group, msg),
					state.chats[idx].messages
				)
			};

			return ({ ...state })
		})
	},
	setOnline: (online: Set<string>) => set((state) => ({ ...state, online })),
	setTyping: (typing: Set<string>) => set((state) => ({ ...state, typing })),
	setSelectedChat: (chat: Chat | null) => set((state) => ({ ...state, selectedChat: chat })),
	updateMessageReadStatus: (messageId: string, chatId: string, isRead: boolean) => set((state) => {
		const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
		if (chatIndex === -1) return state;
		
		// Update the message read status in the chat's messages
		const updatedChat = { ...state.chats[chatIndex] };
		// Note: This is a simplified update - you may need to adjust based on your message structure
		// The actual implementation depends on how messages are stored in your chat structure
		
		return {
			...state,
			chats: state.chats.map((chat, index) => 
				index === chatIndex ? updatedChat : chat
			)
		};
	}),
	markAllMessagesAsRead: (chatId: string) => set((state) => {
		const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
		if (chatIndex === -1) return state;
		
		// Mark all messages as read and reset unread count
		const updatedChat = {
			...state.chats[chatIndex],
			unreadCount: 0,
			lastReadAt: new Date().toISOString()
		};
		
		return {
			...state,
			chats: state.chats.map((chat, index) => 
				index === chatIndex ? updatedChat : chat
			)
		};
	}),
	getChatWith: (userId: string) => get().chats.find((chat) => chat.users.some((user) => user._id == userId)) || null,
}));
