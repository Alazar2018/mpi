// components/ProtectedRoute.tsx
import { useAuthStore } from "@/store/auth.store";
import { Navigate, Outlet } from "react-router-dom";
import React from "react";
import AuthLoadingScreen from "./AuthLoadingScreen";

type Role = "player" | "coach" | "parent" | "admin";

export const ProtectedRoute = ({
                                   allowedRoles,
                                   children
                               }: {
    allowedRoles: Role[];
    children?: React.ReactNode;
}) => {
    const authStore = useAuthStore();
    
    // Load from localStorage if not hydrated - do this immediately
    React.useEffect(() => {
        if (!authStore.isHydrated) {
            const hasData = authStore.loadFromStorage();
            // Always mark as hydrated after attempting to load, regardless of whether data exists
            if (!hasData) {
                authStore.setHydrated(true);
            }
        }
    }, [authStore]);
    
    // Show loading screen only during initial hydration
    if (!authStore.isHydrated) {
        return <AuthLoadingScreen />;
    }

    const role = authStore.getRole();

    // If no role, redirect to login immediately
    if (!role) {
        return <Navigate to="/login" replace />;
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(role as Role)) {
        // Redirect based on role - players go to learn, coaches to players, parents to matches
        switch (role) {
            case "player":
                return <Navigate to="/admin/learn" replace />;
            case "coach":
                return <Navigate to="/admin/players" replace />;
            case "parent":
                return <Navigate to="/admin/matchs" replace />;
            default:
                return <Navigate to="/admin" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};