import Button from "@/components/Button";
import icons from "@/utils/icons";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";

export default function PlayerDetail() {
  const local = useLocation();
  const params = useParams();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 bg-white rounded-3xl py-4 px-6">
        <span>Player Detail</span>
        <div
          className="flex gap-4
				"
        >
          <Button className="!px-5" icon={icons.chat} type="neutral">
            Messege
          </Button>
          <Button className="!px-5 !gap-2" icon={icons.user} type="danger">
            Remove Player
          </Button>
        </div>
      </div>
      <div className="flex gap-4 bg-white rounded-3xl py-4 px-6">
        <div className="w-[9rem] h-[6.75rem] bg-gray-200 rounded-lg"></div>
        <div className="">
          <div className="grid grid-cols-[1fr_max-content] gap-4 py-2 px-8">
            <span className="text-gray-2 text-xs">Full Name</span>
            <span className="text-gray-3 font-bold text-xs">Birhane Araya</span>
          </div>
          <div className="grid grid-cols-[1fr_max-content] gap-4 py-2 px-8">
            <span className="text-gray-2 text-xs">Email :</span>
            <span className="text-gray-3 font-bold text-xs">
              birhanearaya23@gmail.com
            </span>
          </div>
          <div className="grid grid-cols-[1fr_max-content] gap-4 py-2 px-8">
            <span className="text-gray-2 text-xs">Phone : :</span>
            <span className="text-gray-3 font-bold text-xs">
              +251 945065432
            </span>
          </div>
        </div>
        <div className="gap-4 bg-white rounded-3xl py-4 px-6">
          <div className="grid grid-cols-[1fr_max-content] gap-4 py-2 px-8">
            <span className="text-gray-2 text-xs">Address</span>
            <span className="text-gray-3 font-bold text-xs">
              Addis Ababa, Ethiopia
            </span>
          </div>
          <div className="grid grid-cols-[1fr_max-content] gap-4 py-2 px-8">
            <span className="text-gray-2 text-xs">Joined :</span>
            <span className="text-gray-3 font-bold text-xs">May 12 2025</span>
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <div className="flex items-center h-9 bg-green-1 p-2 gap-4 rounded-full text-xs">
            <div className="flex h-5 items-center gap-1 bg-green-2 rounded-full px-2 ">
              <i dangerouslySetInnerHTML={{ __html: icons.check }} />
              UTSA #18
            </div>
            <span className="text-green-5">US 1234123444</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-9 bg-white rounded-3xl py-4 px-6">
        <div className="h-14 bg-blue-1 mx-auto flex items-center gap-3 rounded-2xl p-2">
          {[
            { name: "Profile", to: `/admin/players/detail/${params.id}` },
            {
              name: "Matches",
              to: `/admin/players/detail/${params.id}/matches`,
            },
            { name: "Goals", to: `/admin/players/detail/${params.id}/goals` },
            {
              name: "Classes",
              to: `/admin/players/detail/${params.id}/classes`,
            },
            { name: "SOT", to: `/admin/players/detail/${params.id}/sot` },
          ].map((el) => {
            return (
              <NavLink
                className={({ isActive }) => {
                  return isActive && el.to == local.pathname
                    ? "active-route"
                    : "";
                }}
                key={el.name}
                to={el.to}
              >
                <Button
                  type={local.pathname == el.to ? "action" : "none"}
                  className={`!rounded-lg !font-normal !px-5 !h-10`}
                >
                  {el.name}
                </Button>
              </NavLink>
            );
          })}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
