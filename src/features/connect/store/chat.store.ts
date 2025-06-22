import type { User } from "@/store/auth.store";
import { genId } from "@/utils/utils";
import { create } from "zustand";

const addToGroup = (group: MessageGroup, message: Message): MessageGroup => {
	const date = new Date(message.createdAt);
	const year = date.getFullYear().toString();
	const month = (date.getMonth()).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');

	const g = {
		...group,
		[year]: {
			...group[year],
			[month]: {
				...group[year]?.[month],
				[day]: [
					...(group[year]?.[month]?.[day] || []),
					message
				]
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
		createdAt: new Date(chat.latestMessageTimeStamp),
		updatedAt: new Date(chat.latestMessageTimeStamp),
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
			[day: string]: Message[];
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
	messages: MessageGroup
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
	typing: Set<string>,
	online: Set<string>,
	addChat: (chat: Chat) => void,
	setChats: (chat: Chat[]) => void;
	addMessage: (newMessage: NewMessage | Message) => void,
	addMessages: (newMessages: { chatId: string, messages: Message[] }) => void;
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
	typing: new Set<string>(),
	online: new Set<string>(),
	setChats: (chat: Chat[]) => set((state) => {
		return ({
			...state, chats: chat.map((el) => {
				return {
					...el,
					messages: {}
				}
			})
		})
	}),
	addChat: (chat: Chat) => set((state) => {
		return ({ ...state, chat: [...state.chats, chat] })
	}),
	addMessage: (newMessage: NewMessage | Message) => {
		return set((state) => {
			console.log(newMessage);
			const idx = state.chats.findIndex((chat) => chat._id == ('_id' in newMessage ? newMessage.chat._id : newMessage.chatId))
			if (idx == -1) return state
			const id = genId.next().value as string
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
			}

			state.chats[idx] = {
				...state.chats[idx],
				messages: addToGroup(state.chats[idx].messages, newMsg as Message)
			};

			console.log(state.chats[idx].messages);
			return { ...state };
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
	getChatWith: (userId: string) => get().chats.find((chat) => chat.users.some((user) => user._id == userId)) || null,
}));
