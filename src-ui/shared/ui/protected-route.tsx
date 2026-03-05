import { useUserStore } from "@/entities/user";
import { hasPermission } from "@/shared/lib/auth/role-permissions";
import { pathKeys } from "@/shared/lib/react-router";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission: string;
    fallbackPath?: string;
}

export function ProtectedRoute({
    children,
    requiredPermission,
    fallbackPath = pathKeys.accessDenied()
}: ProtectedRouteProps) {
    const user = useUserStore(state => state.currentUser);
    const location = useLocation();

    if (!user) {
        return <Navigate to={pathKeys.login()} state={{ from: location }} replace />;
    }

    if (!hasPermission(user.roles, requiredPermission)) {
        return <Navigate to={fallbackPath} replace />;
    }

    return <>{children}</>;
}