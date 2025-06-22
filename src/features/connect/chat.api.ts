import { getApi } from "@/utils/utils";
import type { Chat, Message } from "./store/chat.store";

const api = getApi('/chats')
const messageApi = getApi('/messages')

export function getChats() {
	return api.addAuthenticationHeader().get<{chats: Chat[]}>('')
}

export function moreChat(chatId: string) {
	return messageApi.addAuthenticationHeader().get<{messages: Message[]}>(`/${chatId}`)
}