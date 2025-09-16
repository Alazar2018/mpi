import Button from "@/components/Button";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";
import { getNavsByRole } from "@/config/navs";

import {useAuthStore} from "@/store/auth.store";

import { ToastContainer, toast } from 'react-toastify';
import { useEffect, useState } from "react";
import {
    Link,
    NavLink,
    Outlet,
    useLocation,
    useMatch,
    useMatches, useNavigate,
} from "react-router-dom";
import {isTokenExpired} from "@utils/jwt.ts";
import icons from "@utils/icons.ts";


export default function MainLayout() {
    const authStore = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const path = useMatch("/*");
    const local = useLocation();
    const matchs = useMatches();
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        toast.info(
            <div>
                <p className="font-bold">Are you sure you want to logout?</p>
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss();
                            authStore.clearUser();
                            localStorage.clear();
                            // Reset dark mode to light mode for login page
                            document.documentElement.classList.remove('dark');
                            navigate("/login");
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                    >
                        Logout
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        className="px-3 py-1 bg-gray-200 rounded text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeButton: false,
                closeOnClick: false,
                draggable: false,
            }
        );
    };

    // Get role-based navigation items
    const userRole = authStore.getRole();
    const filteredNavs = getNavsByRole(userRole);
    const filteredMatchs = matchs.filter((el) => el.handle);
    
    // Listen for dark mode changes to update toast theme
    useEffect(() => {
        const updateToastTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            // Force re-render of ToastContainer with new theme
            const toastContainer = document.querySelector('[data-testid="toast-container"]');
            if (toastContainer) {
                toastContainer.setAttribute('data-theme', isDark ? 'dark' : 'light');
            }
        };

        // Create a mutation observer to watch for dark mode class changes
        const observer = new MutationObserver(updateToastTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // Don't render navigation until auth store is hydrated
    if (!authStore.isHydrated) {
        return (
                    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-[var(--text-secondary)]">Loading...</p>
            </div>
        </div>
        );
    }

    const activeNav = filteredNavs.find(
        (el) => el.path == filteredMatchs?.[0]?.pathname.replace(/\/$/, "")
    );

    useEffect(() => {
        (async () => {
            // First, try to load from localStorage
            const hasStoredData = authStore.loadFromStorage();
            
            // Mark as hydrated after loading from storage
            if (hasStoredData) {
                authStore.setHydrated(true);
            } else {
                // If no stored data, still mark as hydrated to avoid infinite loading
                authStore.setHydrated(true);
            }
            
            // If we already have a valid access token that's not expired, don't refresh
            if (authStore.accessToken && !isTokenExpired(authStore.accessToken)) {
                // Refresh user avatar in the background to ensure it's up to date
                if (authStore.user) {
                    authStore.refreshUser().catch(err => {
                        console.log("Avatar refresh failed (non-critical):", err);
                    });
                }
                setIsLoading(false);
                return;
            }
            
            // If we have a user and tokens, we're already authenticated
            if (authStore.user && authStore.tokens) {
                // Refresh user avatar in the background to ensure it's up to date
                authStore.refreshUser().catch(err => {
                    console.log("Avatar refresh failed (non-critical):", err);
                });
                setIsLoading(false);
                return;
            }
            
            // Authentication is now handled by ProtectedRoute wrapper
            // No need to redirect here as ProtectedRoute will handle it
            setIsLoading(false);
        })();
    }, []);

    return !isLoading ? (
        <>
            <div className="relative p-4 mx-auto flex gap-1 h-full w-full">
                {/* Sidebar */}
                <div
                    style={{
                        boxShadow: "0px 16px 44px 0px rgba(0, 0, 0, 0.07)",
                    }}
                    className={`fixed md:relative z-40 rounded-2xl flex flex-col gap-8 py-8 px-6 bg-[var(--bg-card)] min-w-[14.625rem] h-[calc(100vh-2rem)] transition-all duration-300
    ${mobileMenuOpen ? 'left-4' : '-left-full md:left-0'}`}
                >
                    {/* Logo and Toggle Button Container */}
                    <div className="flex items-center justify-between">
                        <div className="grid place-items-center">
                            <img src="/logo.png" className="max-w-full w-[8rem]" />
                        </div>

                        {/* Close Button - Only visible on mobile when menu is open */}
                        <button
                            className="md:hidden p-2"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Close menu"
                        >
                            <i
                                className="*:size-6"
                                dangerouslySetInnerHTML={{ __html: icons.close }}
                            />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto flex flex-col px-1 py-2 gap-4">
                        {filteredNavs.map((nav) => {
                            return (
                                <NavLink
                                    tabIndex={-1}
                                    className={() => {
                                        // Check if current path starts with nav path (for sub-pages)
                                        // Check if current path starts with nav path (for sub-pages)
                                        // Special handling for dashboard: only active when exactly on /admin
                                        const isActiveRoute = nav.path === '/admin' 
                                            ? local.pathname === '/admin' 
                                            : local.pathname.startsWith(nav.path);
                                        return `transition-all duration-300 ${
                                            isActiveRoute 
                                                ? "active-route" 
                                                : "hover:bg-[var(--bg-secondary)] dark:hover:bg-[var(--bg-tertiary)]"
                                        }`;
                                    }}
                                    key={nav.path}
                                    to={nav.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Button
                                        className={`!px-4 !w-full ${
                                            (nav.path === '/admin' 
                                                ? local.pathname === '/admin' 
                                                : local.pathname.startsWith(nav.path))
                                                ? "!bg-secondary !text-white" 
                                                : "!bg-transparent !text-[var(--text-primary)] dark:!text-[var(--text-secondary)]"
                                        }`}
                                        type="none"
                                        icon={nav.icon}
                                    >
                                        {nav.name}
                                    </Button>
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Logout Button */}
                    <div className="mt-auto">
                        <Button
                            onClick={handleLogoutClick}
                            className="!px-4 !w-full !bg-red-500 hover:!bg-red-600 !text-white"
                            type="none"
                            icon={icons.logout}
                        >
                            Logout
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="z-20 grid place-items-center text-white font-black text-2xl absolute top-0 left-0 translate-y-[-50%] translate-x-[calc(-50%+2.5rem)] size-12 rounded-full bg-secondary border-4 border-[var(--bg-card)]">
                            ?
                        </div>
                        <div className="left-corder-circle text-center py-4 gap-2 flex flex-col justify-center items-center rounded-lgg bg-secondary text-white transition-colors duration-300">
                            <span className="font-bold mt-4 text-base">Help Center</span>
                            <span className="text-xs max-w-[25ch]">
                                Having Trouble in Learning. Please contact us for more questions.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-full md:max-w-[calc(100%-13rem)] flex-1 flex flex-col gap-3">
                    <div className="h-[68px] flex p-2">
                        <Header
                            mobileMenuOpen={mobileMenuOpen}
                            setMobileMenuOpen={setMobileMenuOpen}
                        />
                    </div>
                    <Breadcrumb />
                    <div className="p-2 flex flex-col gap-2 overflow-auto h-full bg-[var(--bg-primary)]">
                        <div className="flex gap-4 items-center text-[var(--text-primary)]">
                            {activeNav && (
                                <div className="ml-2 flex gap-4">
                                    <i className="text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: activeNav?.icon }} />
                                </div>
                            )}
                            {filteredMatchs.length > 0 &&
                                filteredMatchs.map((route) => {
                                    return (
                                        <Link to={route.pathname} key={route.pathname}>
                                            <span className="font-bold text-base text-[var(--text-primary)]">
                                                {(route.handle as any)?.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                        </div>
                        <Outlet />
                    </div>
                </div>
            </div>
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            />
        </>
    ) : (
        <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-[var(--text-secondary)]">Loading...</p>
            </div>
        </div>
    );
}