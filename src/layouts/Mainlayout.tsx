import Button from "@/components/Button";
import navs from "@/config/navs";
import { refreshToken } from "@/features/auth/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { getCookies } from "@/utils/utils";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useMatch,
  useMatches,
} from "react-router-dom";

export default function MainLayout() {
  const authStore = useAuthStore();
  const [l, s] = useState(false);
  const cookies = getCookies();
  const path = useMatch("/*");
  const local = useLocation();
  const matchs = useMatches();

  const filteredMatchs = matchs.filter((el) => el.handle);

  const activeNav = navs.find(
    (el) => el.path == filteredMatchs?.[0]?.pathname.replace(/\/$/, "")
  );

  useEffect(() => {
    (async () => {
      if (authStore.accessToken) {
        s(true);
        return;
      }
      s(false);
      try {
        const res = await refreshToken({
          refreshToken: cookies.refreshToken,
        });
        const newAccessToken = res.data.tokens.accessToken;
        const newRefreshToken = res.data.tokens.refreshToken;
        authStore.setToken(newAccessToken, newRefreshToken);
        document.cookie = `refreshToken=${newRefreshToken}`;
        s(true);
      } catch (err) {
        console.log((err as unknown as Error).message);
        location.href = "/login?redirect=" + path?.pathname;
      }
    })();
  }, []);

  return l ? (
    <>
      <div className="p-4 max-w-[1440px] mx-auto flex gap-1 h-full w-full">
        <div
          style={{
            boxShadow: "0px 16px 44px 0px rgba(0, 0, 0, 0.07)",
          }}
          className="rounded-2xl flex flex-col gap-8 py-8 px-6 bg-white min-w-[14.625rem]"
        >
          <div className="grid place-items-center">
            <img src="/logo.png" className="max-w-full w-[8rem]" />
          </div>
          <div className="flex-1 overflow-auto flex flex-col px-1 py-2 gap-4">
            {navs.map((nav) => {
              return (
                <NavLink
                  tabIndex={-1}
                  className={({ isActive }) => {
                    return isActive && nav.path == local.pathname
                      ? "active-route"
                      : "";
                  }}
                  key={nav.name}
                  to={nav.path}
                >
                  <Button
                    className="!px-4 !w-full"
                    type="none"
                    icon={nav.icon}
                  >
                    {nav.name}
                  </Button>
                </NavLink>
              );
            })}
          </div>
          <div className="relative">
            <div className="z-20 grid place-items-center text-white font-black text-2xl absolute top-0 left-0 translate-y-[-50%] translate-x-[calc(-50%+2.5rem)] size-12 rounded-full bg-secondary border-4 border-white">
              ?
            </div>
            <div className="left-corder-circle text-center py-4 gap-2 flex flex-col justify-center items-center rounded-lgg bg-secondary text-white">
              <span className="font-bold mt-4 text-base">Help Center</span>
              <span className="text-xs max-w-[25ch]">
                Having Trouble in Learning. Please contact us for more
                questions.
              </span>
            </div>
          </div>
        </div>
        <div className="w-full max-w-[calc(100%-13rem)] flex-1 flex flex-col gap-3">
          <div className="h-[58px] flex p-2">
            <div className="bg-white rounded-3xl w-full h-[58px]"></div>
          </div>
          <div className="p-2 flex flex-col gap-2 overflow-auto h-full">
            <div className="flex gap-4 items-center">
              {activeNav && (
                <div className="ml-2 flex gap-4">
                  <i dangerouslySetInnerHTML={{ __html: activeNav?.icon }} />
                </div>
              )}
              {filteredMatchs.length &&
                filteredMatchs.map((route) => {
                  return (
                    <Link to={route.pathname} key={route.pathname}>
                      <span className="font-bold text-base">
                        {route.handle?.name}
                      </span>
                    </Link>
                  );
                })}
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  ) : (
    "loading ..."
  );
}
