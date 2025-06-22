import Button from "@/components/Button";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getChats } from "./chat.api";
import { useChatStore } from "./store/chat.store";

export default function Connect() {
	const local = useLocation();
	const chatStore = useChatStore()

	const chatsReq = useApiRequest({
		cacheKey: 'chats',
		freshDuration: 1000 * 60 * 60,
		staleWhileRevalidate: true,
		maxAge: 1000 * 60 * 60,
	})
	
	useEffect(() => {
		chatsReq.send(
			() => getChats(),
			res => {
				if(res.success) {
					chatStore.setChats(res.data?.chats ?? [])
				}
			}
		)
	}, [])

	return (
		<div className="flex flex-col gap-4 bg-white rounded-3xl p-4 px-6 h-[calc(100%-1.7rem)]">
      <div className="flex items-center gap-[2px]">
				{
					[
						{ name: "Messages", to: `/admin/connect` },
						{
							name: "Groups",
							to: `/admin/connect/groups`,
						},
						{ name: "Friends", to: `/admin/connect/friends` },
						{
							name: "Announcements",
							to: `/admin/connect/announcements`,
						},
						{ name: "Community", to: `/admin/connect/community` },
					].map((el) => {
						return (
							<NavLink
								tabIndex={-1}
								key={el.name}
								to={el.to}
							>
								<Button
									type={local.pathname == el.to ? "action" : "none"}
									className={`!rounded-lg !font-normal !px-5 !h-10 ${local.pathname == el.to ? '!bg-secondary !text-white' : ''}`}
								>
									{el.name}
								</Button>
							</NavLink>
						)
					})
				}
			</div>
			<Outlet />
		</div>
	)
}