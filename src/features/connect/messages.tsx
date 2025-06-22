import icons from "@/utils/icons";
import { useChatStore, type Chat } from "./store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import DMChat from "./components/DMChat";
import { useState } from "react";

export default function Messages() {
  const authStore = useAuthStore();
  const chatStore = useChatStore();
  const [selected, setSelected] = useState<Chat | null>(null);

  function getChatWith(chat: Chat) {
    return chat.users.find((user) => user._id != authStore.user?._id);
  }

  function selectChat(chat: Chat) {
    setSelected(chat);
  }

  return (
    <div className="flex gap-4 h-[calc(100%-3.5rem)]">
      <div className="w-[379px] p-4 bg-blue-1 rounded-2xl flex flex-col gap-4">
        <div className="h-14 rounded-lgg bg-white p-4 flex items-center justify-between">
          <span className="font-bold">Messages</span>
          <button className="text-white grid place-items-center min-w-[18px] min-h-[18px] bg-secondary rounded-full">
            <i
              className="*:w-2 :h-2"
              dangerouslySetInnerHTML={{ __html: icons.plus }}
            />
          </button>
        </div>
        <div className="overflow-auto p-4 rounded-lgg flex-1  bg-white flex flex-col gap-6 max-h-max">
          {chatStore.chats.length > 0 ? (
            <div
              tabIndex={-1}
              className="sys-focus min-h-12 rounded-lgg bg-gray-7 flex px-3.5"
            >
              <input
                placeholder="Search messages"
                className="focus:shadow-none h-full w-full text-[13px]"
              />
              <button tabIndex={-1}>
                <i dangerouslySetInnerHTML={{ __html: icons.search }} />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <button className="w-12 h-12 rounded-3xl bg-secondary text-white flex items-center justify-center">
                  <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
                </button>
                <span>Add new chat</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {chatStore.chats
              .filter((el) => !el.isGroupChat)
              .map((chat) => (
                <div
                  onClick={() => selectChat(chat)}
                  key={chat._id}
                  tabIndex={0}
                  className={`relative rounded-lgg p-2 border-b border-gray-7 gap-4 flex items-center ${chat._id == selected?._id ? "bg-gray-1" : "bg-white"}`}
                >
                  <div className="absolute right-1 top-2 bg-amber-50 text-[13px] opacity-30 size-5 grid place-items-center-safe">
                    1m
                  </div>
                  <div className="w-12 h-11 rounded-lg bg-gray-8 overflow-hidden">
                    <img
                      src={getChatWith(chat)?.avatar}
                      className="w-full h-full max-w-full object-cover"
                    />
                  </div>
                  <div className="max-w-[calc(100%-5rem)] flex-1 flex flex-col justify-center">
                    <span className="font-bold truncate">
                      {" "}
                      {`${getChatWith(chat)?.firstName} ${
                        getChatWith(chat)?.lastName
                      }`}
                    </span>
                    <span className="text-black/40 truncate">
                      {chat.latestMessageContent}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* Where the magic happens */}
      <DMChat chat={selected} />
    </div>
  );
}
