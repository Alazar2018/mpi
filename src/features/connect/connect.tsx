import Button from "@/components/Button";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";

export default function Connect() {
	const local = useLocation();
	const params = useParams();
	
	return (
		<div className="flex flex-col gap-4 bg-white rounded-3xl p-4 px-6">
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
									className={`!rounded-lg !font-normal !px-5 !h-10 ${local.pathname == el.to ? '!bg-green-2 !text-secondary' : ''}`}
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