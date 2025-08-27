// Export message service and types
export { messageService } from '@/service/message.server';
export type { 
  Message, 
  MessageSender, 
  MessageChat, 
  MessageListResponse,
  CreateMessageRequest,
  CreateMessageWithImageRequest,
  UpdateMessageRequest,
  GetMessagesParams
} from '@/service/message.server';
