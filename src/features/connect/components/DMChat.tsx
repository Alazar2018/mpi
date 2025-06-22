import ResizableTextArea from "@/components/ResizableTextArea";
import icons from "@/utils/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore, type Chat, type Message } from "../store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import { useApiRequest } from "@/hooks/useApiRequest";
import { moreChat } from "../chat.api";
import { secondDateFormat } from "@/utils/utils";
import StickyDate from "@/components/StickyDate";

export default function DMChat({ chat }: { chat: Chat | null }) {
  const chatStore = useChatStore();
  const textarea = useRef<HTMLTextAreaElement>(null);

  const moreChats = useApiRequest({
    cacheKey: `messages_${chat?._id}`,
    freshDuration: 1000 * 60 * 60,
    staleWhileRevalidate: true,
    maxAge: 1000 * 60 * 60,
  });
  const authStore = useAuthStore();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!chat?._id || chat?.init) return;
    moreChats.send(
      () => moreChat(chat?._id),
      (res) => {
        console.log(res.data);
        if (res.success) {
          chatStore.addMessages({
            chatId: chat._id,
            messages: res.data?.messages as Message[],
          });
        }
      }
    );
  }, [chat?._id]);

  const onChange = useCallback((e: Event) => {
    const value = (e.target as HTMLTextAreaElement).value;
    setMessage(value);
  }, []);

  const send = useCallback(() => {
    if (!message) return;
    const newMsg = chatStore.addMessage({
      chatId: chat?._id as string,
      content: message,
      senderId: authStore.user?._id as string,
    });

    console.log(newMsg);
    if (textarea.current && textarea.current?.value) {
      textarea.current.value = "";
      textarea.current.focus();
    }

    setMessage("");
  }, [chat?._id, message]);

  function getChatWith() {
    return chat?.users?.find?.((user) => user._id != authStore.user?._id);
  }
  const isOnline = chatStore.online.has(getChatWith()?._id as string);

  if (!chat)
    return (
      <div className="flex-1 rounded-2xl overflow-hidden grid place-items-center h-full">
        <span>Select one to start Chat</span>
      </div>
    );

  return (
    <div className="flex-1 rounded-2xl overflow-hidden grid grid-cols-1 grid-rows-[76px_1fr_auto] h-full">
      <div className="bg-blue-1 p-4 flex items-center justify-between">
        <div className="flex gap-4 items-center justify-between">
          <div className="size-10 bg-gray-4 rounded overflow-hidden">
            <img
              className="w-full h-full object-cover max-w-full"
              src={getChatWith()?.avatar}
            />
          </div>
          <div className="">
            <span className="font-bold leading-none">{`${
              getChatWith()?.firstName
            } ${getChatWith()?.lastName}`}</span>
            <div className="flex gap-2 items-center leading-5">
              {isOnline ? (
                <>
                  <div className="size-2.5 bg-secondary rounded-full"></div>
                  <span className="text-[13px] opacity-60">Online</span>
                </>
              ) : (
                <span className="text-[13px] opacity-60">Offline</span>
              )}
            </div>
          </div>
        </div>
        <div className="bg-secondary px-4 py-2.5 text-white flex items-center gap-2 rounded-lg">
          <i dangerouslySetInnerHTML={{ __html: icons.call }} />
          <span>Call</span>
        </div>
      </div>
      <div
        id="chatwrapper"
        className="p-[34px] pt-0 overflow-auto relative flex flex-col-reverse"
      >
        {Object.entries(
          chatStore.chats.find((el) => el._id == chat._id)?.messages || {}
        ).map(([year, months]) => {
          return (
            <>
              {Object.keys(months)
                .sort()
                .reverse()
                .map((month) => {
                  return (
                    <>
                      {Object.keys(months[month])
                        .sort()
                        .reverse()
                        .map((day) => (
                          <div key={`${day}_${year}_${month}`}>
                            <div className="sticky w-full text-center top-0">
                              <StickyDate
                                date={secondDateFormat(
                                  new Date(
                                    +year,
                                    Number(month),
                                    Number(day)
                                  ).toLocaleDateString(),
                                  false
                                )}
                              />
                            </div>
                            {months[month][day].map((el) => {
                              return <p key={el.id}>
                                {el.content}
                                </p>;
                            })}
                          </div>
                        ))}
                    </>
                  );
                })}
            </>
          );
        })}
      </div>
      <div className="bg-blue-1 p-4 flex items-center justify-between">
        <div className="grid w-full grid-cols-[46px_1fr] gap-2">
          <button className="self-end min-h-[48px] grid bg-white place-items-center rounded-lgg">
            <label>
              <i dangerouslySetInnerHTML={{ __html: icons.file }} />
              <input type="file" className="hidden" />
            </label>
          </button>
          <div className="bg-white rounded-lgg p-2 flex items-center gap-2 justify-between">
            <div className="flex-1 flex items-center">
              <ResizableTextArea ref={textarea} onChange={onChange} />
            </div>
            <button
              onClick={send}
              className="cursor-pointer min-w-10 max-h-[48px] self-end h-full grid place-items-center"
            >
              <i dangerouslySetInnerHTML={{ __html: icons.send }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
