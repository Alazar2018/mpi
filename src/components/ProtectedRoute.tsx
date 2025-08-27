// components/ProtectedRoute.tsx
import { useAuthStore } from "@/store/auth.store";
import { Navigate, Outlet } from "react-router-dom";
import React from "react";

type Role = "player" | "coach" | "parent" | "admin";

export const ProtectedRoute = ({
                                   allowedRoles,
                                   children
                               }: {
    allowedRoles: Role[];
    children?: React.ReactNode;
}) => {
    const authStore = useAuthStore();
    const role = authStore.getRole();
    
   
    
    // Load from localStorage if not hydrated
    React.useEffect(() => {
        if (!authStore.isHydrated) {
            authStore.loadFromStorage();
        }
    }, [authStore]);
    
    // Wait for hydration to complete
    if (!authStore.isHydrated) {
        return <div>Loading...</div>;
    }

    // If no role, redirect to login
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