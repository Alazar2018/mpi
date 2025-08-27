import { chatService } from "@/service/chat.server";
import type { Chat, Message } from "./store/chat.store";

// Re-export the chat service methods for backward compatibility
export const getChats = () => chatService.getChats();
export const moreChat = (chatId: string) => chatService.getChatById(chatId);

// Export additional chat service methods
export const {
  createDirectChat,
  createGroupChat,
  getGroupChatById,
  updateGroupChatName,
  updateGroupChatPhoto,
  addUsersToGroup,
  removeUsersFromGroup,
  leaveGroupChat,
  deleteGroupChat,
  getTotalUnreadCount,
  archiveChat,
  pinChat,
  markChatAsRead,
  muteChat,
  transferGroupAdmin,
  getChatStatistics,
  searchChatMessages,
  bulkChatOperations,
  getDirectChatByUserId,
  getChatsByFilter,
  searchChats,
  getUnreadChats,
  getGroupChats,
  getDirectChats
} = chatService;